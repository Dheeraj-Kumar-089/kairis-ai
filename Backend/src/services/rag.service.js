import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "langchain";
import { config } from "../config/config.js";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || "cohort-2-rag");

const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY,
    model: "mistral-embed",
});

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
});


async function parsePdf(buffer) {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    return data.text;
}

async function parseImage(buffer, mimetype) {
    const keys = config.GEMINI_API_KEYS || [];
    const apiKey = keys.length > 0 ? keys[0] : (config.GEMINI_API_KEY || "");
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured for image OCR");
    }

    const visionModel = new ChatGoogleGenerativeAI({
        model: "gemini-3.1-flash-lite",
        apiKey: apiKey,
    });

    const response = await visionModel.invoke([
        new HumanMessage({
            content: [
                {
                    type: "text",
                    text: `Extract ALL text visible in this image exactly as written (OCR).
Then, on new lines, briefly describe any diagrams, charts, tables, or figures so the content is searchable.
Return only the extracted text and descriptions, no commentary.`,
                },
                {
                    type: "image_url",
                    image_url: `data:${mimetype};base64,${buffer.toString("base64")}`,
                },
            ],
        }),
    ]);
    return response.text;
}

const EMBED_BATCH_SIZE = 96; // texts per embeddings.embedDocuments() call

// Sliding-window throttle: only waits once we're actually near Mistral's
// 60 req/min embeddings limit, instead of a flat delay on every single
// batch. Typical repos (well under the per-minute cap) now index with
// close to zero artificial delay; only large ones get throttled, and only
// by as much as the limit actually requires.
const MAX_REQUESTS_PER_WINDOW = 55; // safety margin under the real limit of 60
const WINDOW_MS = 60000;
const requestTimestamps = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function throttleEmbedRequest() {
    const now = Date.now();
    while (requestTimestamps.length && now - requestTimestamps[0] > WINDOW_MS) {
        requestTimestamps.shift();
    }
    if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        const waitMs = WINDOW_MS - (now - requestTimestamps[0]) + 50;
        await sleep(waitMs);
        return throttleEmbedRequest();
    }
    requestTimestamps.push(Date.now());
}

// Chunk + embed + upsert one or more {filename, text} pairs into Pinecone.
// Shared by storeDocument (single pdf/image) and repo indexing (many code files).
// Uses one batched embedDocuments() call per chunk-batch (instead of N parallel
// embedQuery() calls) to avoid blowing the embeddings API's rate limit.
export async function storeTextChunks({ texts, userId, chatId }) {
    const chatIdStr = String(chatId || "general");
    const timestamp = Date.now();

    // Pool chunks from ALL files into one flat list before batching. Batching
    // per-file (the old approach) meant a repo with many small files fired
    // one tiny embed API call per file instead of filling full-size batches -
    // by far the biggest source of extra round-trips for typical repos.
    const pooled = [];
    for (const { filename, text } of texts) {
        if (!text || !text.trim()) continue;
        const chunks = await splitter.splitText(text);
        const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
        chunks.forEach((chunk, idx) => {
            pooled.push({ chunk, filename, safeFilename, idx });
        });
    }

    const upsertPromises = [];

    for (let i = 0; i < pooled.length; i += EMBED_BATCH_SIZE) {
        const batch = pooled.slice(i, i + EMBED_BATCH_SIZE);

        await throttleEmbedRequest();
        const vectors = await embeddings.embedDocuments(batch.map((b) => b.chunk));

        const records = batch.map((b, j) => ({
            id: `${userId}-${timestamp}-${b.safeFilename}-${b.idx}`,
            values: vectors[j],
            metadata: {
                text: b.chunk,
                userId: String(userId),
                chatId: chatIdStr,
                filename: b.filename,
            },
        }));

        // Fire the upsert without blocking the next batch's embedding call -
        // upsert and embed are independent network calls, so overlapping
        // them (instead of strictly serializing embed -> upsert -> embed ->
        // upsert) roughly halves the wall-clock time of this loop.
        upsertPromises.push(index.upsert({ records }));
    }

    await Promise.all(upsertPromises);

    return { chunks: pooled.length, files: texts.length };
}

// Delete all vectors for a chat (document/image/repo chunks) - called on chat delete.
export async function deleteChatVectors({ userId, chatId }) {
    await index.deleteMany({
        filter: {
            userId: String(userId),
            chatId: String(chatId),
        },
    });
}

// Parse (pdf or image) then store
export async function storeDocument({ buffer, mimetype, filename, userId, chatId }) {
    const text =
        mimetype === "application/pdf"
            ? await parsePdf(buffer)
            : await parseImage(buffer, mimetype);

    if (!text || !text.trim()) {
        throw new Error("No text could be extracted from the file");
    }

    const result = await storeTextChunks({ texts: [{ filename, text }], userId, chatId });
    return { chunks: result.chunks, filename };
}

export async function queryDocuments({ query, userId, chatId, filenames, topK = 4 }) {
    await throttleEmbedRequest();
    const queryEmbedding = await embeddings.embedQuery(query);

    const filter = {
        userId: String(userId)
    };

    if (chatId) {
        // Match the active chat, but also fall back to "general" so
        // documents uploaded before a chat existed (chatId was unset at
        // upload time and got stored as "general") are still retrievable.
        const chatIdStr = String(chatId);
        filter.chatId = chatIdStr === "general"
            ? chatIdStr
            : { "$in": [chatIdStr, "general"] };
    }

    if (filenames && filenames.length > 0) {
        if (filenames.length === 1) {
            filter.filename = filenames[0];
        } else {
            filter.filename = { "$in": filenames };
        }
    }

    const result = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: filter,
    });

    return (result.matches || [])
        .filter((match) => match.metadata?.text)
        .map((match) => ({
            text: match.metadata.text,
            filename: match.metadata.filename,
            score: match.score,
        }));
}
