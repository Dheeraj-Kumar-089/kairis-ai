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

// Parse (pdf or image) 
export async function storeDocument({ buffer, mimetype, filename, userId, chatId }) {
    const text =
        mimetype === "application/pdf"
            ? await parsePdf(buffer)
            : await parseImage(buffer, mimetype);

    if (!text || !text.trim()) {
        throw new Error("No text could be extracted from the file");
    }

    const chunks = await splitter.splitText(text);

    const docs = await Promise.all(
        chunks.map(async (chunk) => {
            const embedding = await embeddings.embedQuery(chunk);
            return { text: chunk, embedding };
        })
    );

    const timestamp = Date.now();
    
    await index.upsert({
        records: docs.map((doc, i) => ({
            id: `${userId}-${timestamp}-${i}`,
            values: doc.embedding,
            metadata: {
                text: doc.text,
                userId: String(userId),
                chatId: String(chatId || "general"),
                filename,
            },
        })),
    });

    return { chunks: docs.length, filename };
}

export async function queryDocuments({ query, userId, chatId, filenames, topK = 4 }) {
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
