import { generateResponse, generateChatTitle, generateSummary } from "../services/ai.service.js";
import { storeDocument, storeTextChunks, queryDocuments, deleteChatVectors } from "../services/rag.service.js";
import { uploadFile } from "../services/storage.service.js";
import { fetchRepoFiles } from "../services/github.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import userModel from "../models/user.model.js";
import guestUsageModel from "../models/guestUsage.model.js";
import { config } from "../config/config.js";

const GUEST_MESSAGE_LIMIT = 5;
const GUEST_LIMIT_MESSAGE = "You have already used your free limit. Signup or login to continue.";

export async function sendMessage(req, res) {
    const { message, chat: chatId, attachments } = req.body;
    const isGuest = !req.user;
    let title = null, chat = null;

    try {
        if (isGuest && req.guest.usage.messageCount >= GUEST_MESSAGE_LIMIT) {
            return res.status(403).json({ error: GUEST_LIMIT_MESSAGE, code: "GUEST_LIMIT_REACHED" });
        }


        if (chatId && !isGuest) {
            const existingMessageCount = await messageModel.countDocuments({ chat: chatId });
            if (existingMessageCount >= 35) {
                return res.status(403).json({
                    error: "Chat limit reached. This chat session is closed (max 35 messages). Please switch to a new chat."
                });
            }
        }

        // 2. Fetch/Create Chat
        if (!chatId) {

            title = isGuest ? (message ? message.slice(0, 40) : "Guest chat") : await generateChatTitle(message);
            chat = await chatModel.create(
                isGuest
                    ? { guestId: req.guest.guestId, title }
                    : { user: req.user.id, title }
            );
        }

        const activeChatId = chatId || chat._id;
        const activeChat = chat || await chatModel.findOne(
            isGuest ? { _id: activeChatId, guestId: req.guest.guestId } : { _id: activeChatId, user: req.user.id }
        );

        if (!activeChat) {
            return res.status(404).json({ error: "Chat session not found" });
        }

        // 3. Create User Message
        const userMessage = await messageModel.create({
            chat: activeChatId,
            content: message || "[Attachment]",
            role: "user",
            attachments: attachments || []
        });

        // 4. Fetch all messages in this conversation
        const messages = await messageModel.find({ chat: activeChatId }).sort({ createdAt: 1 });

        // 5. Update User Daily Usage Count (authenticated users only)
        let user = null;
        if (!isGuest) {
            user = await userModel.findById(req.user.id);
            const now = new Date();
            const lastDate = new Date(user.lastMessageDate || now);
            const isSameDay = now.getDate() === lastDate.getDate() &&
                              now.getMonth() === lastDate.getMonth() &&
                              now.getFullYear() === lastDate.getFullYear();

            if (!isSameDay) {
                user.messageCountToday = 0;
            }
            user.messageCountToday += 1;
            user.lastMessageDate = now;
            await user.save();
        }

        // 6. Handle automatic summarization after every 12 messages
        if (messages.length > 0 && messages.length % 12 === 0) {
            try {
                const newSummary = await generateSummary(activeChat.summary || "", messages);
                activeChat.summary = newSummary;
                await activeChat.save();
                console.log(`Generated summary at ${messages.length} messages for chat ${activeChatId}`);
            } catch (sumErr) {
                console.error("Failed to generate summary:", sumErr.message);
            }
        }

        // 7. Slice messages to only pass context since the last summary point
        const sliceStart = Math.floor((messages.length - 1) / 12) * 12;
        const messagesToUse = messages.slice(sliceStart);

  
        let latestFilenames = (attachments || []).map(a => a.fileName);


        if (latestFilenames.length === 0) {
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                if (msg.attachments && msg.attachments.length > 0) {
                    latestFilenames = msg.attachments.map(a => a.fileName);
                    break;
                }
            }
        }

        // Detect if user is asking about previous/older files explicitly
        const queryLower = (message || "").toLowerCase();
        const asksForPrevious = /\b(previous|older|earlier|first|second|third|past|other|all|compare|history)\b/.test(queryLower);

        const searchFilenames = asksForPrevious ? null : latestFilenames;

  
        const identityId = isGuest ? req.guest.guestId : req.user.id;

        let ragContext = "";
        try {
            const matches = await queryDocuments({
                query: message,
                userId: identityId,
                chatId: activeChatId,
                filenames: searchFilenames
            });


            const scoreThreshold = (searchFilenames && searchFilenames.length > 0) ? 0.0 : 0.35;
            const qualityMatches = matches.filter(m => m.score >= scoreThreshold);

            ragContext = qualityMatches
                .map((m) => `[from "${m.filename}" (Similarity Score: ${m.score.toFixed(2)})]\n${m.text}`)
                .join("\n---\n");
        } catch (ragError) {
            console.error("RAG query failed, continuing without context:", ragError.message);
        }

        // 9. Choose model with fallbacks
        let responseText = null;
        let errorLog = [];
        let modelQueue = [];

        if (isGuest) {
            // Guests never touch Gemini for chat replies - only mistral/llama
            // (Groq). Gemini is reserved for the one-photo-per-chat OCR path.
            modelQueue = ["mistral", "llama"];
        } else if (user.messageCountToday <= 20) {
            modelQueue = ["gemini", "mistral", "llama"];
        } else {
            modelQueue = ["mistral", "llama"];
        }

        for (const modelType of modelQueue) {
            try {
                responseText = await generateResponse(messagesToUse, ragContext, activeChat.summary, modelType);
                break;
            } catch (err) {
                console.error(`Fallback error using ${modelType}:`, err.message);
                errorLog.push(`${modelType}: ${err.message}`);
            }
        }

        if (!responseText) {
            return res.status(429).json({
                error: "Limit reached for today. See you tomorrow!",
                details: errorLog.join("; ")
            });
        }

        // 10. Save AI Message
        const aiMessage = await messageModel.create({
            chat: activeChatId,
            content: responseText,
            role: "ai"
        });

        if (isGuest) {
            req.guest.usage.messageCount += 1;
            await req.guest.usage.save();
        }

        res.status(201).json({
            title,
            chat: activeChat,
            aiMessage,
            ...(isGuest ? { guestMessagesLeft: Math.max(0, GUEST_MESSAGE_LIMIT - req.guest.usage.messageCount) } : {}),
        });

    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicUploadsDir = path.join(__dirname, "..", "..", "public", "uploads");

export async function uploadDocument(req, res) {

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { buffer, mimetype, originalname, size } = req.file;
        const { chatId } = req.body;
        const isGuest = !req.user;

        // Check single file size (5MB limit)
        if (size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File size exceeds the 5MB limit." });
        }

        const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(mimetype)) {
            return res.status(400).json({ message: "Only PDF and image files (png, jpg, webp) are supported" });
        }

        const targetChatId = chatId || "general";

        if (isGuest) {
            if (req.guest.usage.messageCount >= GUEST_MESSAGE_LIMIT) {
                return res.status(403).json({ message: GUEST_LIMIT_MESSAGE, code: "GUEST_LIMIT_REACHED" });
            }
            if (mimetype === "application/pdf") {
                return res.status(403).json({ message: "Guests can upload one photo per chat. Signup or login to upload PDFs." });
            }
            if (req.guest.usage.photoUsedChats.includes(String(targetChatId))) {
                return res.status(403).json({ message: GUEST_LIMIT_MESSAGE, code: "GUEST_LIMIT_REACHED" });
            }
        }

        // Upload to ImageKit (CDN), with a fallback to local disk storage
        let fileUrl = "";
        const userId = isGuest ? req.guest.guestId : req.user.id;
        const folderPath = `/kairis-ai/${userId}/${targetChatId}`;

        try {
            const uploadResult = await uploadFile({
                buffer,
                fileName: originalname,
                folder: folderPath
            });
            fileUrl = uploadResult.url;
            console.log("Successfully uploaded document to ImageKit:", fileUrl);
        } catch (imgKitErr) {
            console.error("ImageKit upload failed, falling back to local storage:", imgKitErr.message);
            if (!fs.existsSync(publicUploadsDir)) {
                fs.mkdirSync(publicUploadsDir, { recursive: true });
            }
            const uniqueFilename = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;
            const filePath = path.join(publicUploadsDir, uniqueFilename);
            fs.writeFileSync(filePath, buffer);
            fileUrl = `/uploads/${uniqueFilename}`;
        }

        // Process document text for Pinecone vector database
        const result = await storeDocument({
            buffer,
            mimetype,
            filename: originalname,
            userId,
            chatId: targetChatId
        });

        if (isGuest) {
            req.guest.usage.photoUsedChats.push(String(targetChatId));
            await req.guest.usage.save();
        }

        res.status(201).json({
            message: "Document stored successfully",
            fileUrl,
            fileName: originalname,
            fileType: mimetype,
            ...result,
        });

    } catch (error) {
        console.error("Error storing document:", error);
        res.status(500).json({ message: "Failed to process the uploaded file" });
    }
}

async function getUserGithubToken(userId) {
    const user = await userModel.findById(userId).select("+githubAccessToken");
    return user?.githubAccessToken || null;
}

export async function connectRepo(req, res) {
    try {
        if (!req.user) {
            return res.status(403).json({ message: "Guests can only try the demo repo. Signup or login to connect your own repository." });
        }

        const { repoUrl, chatId } = req.body;

        if (!repoUrl || typeof repoUrl !== "string") {
            return res.status(400).json({ message: "repoUrl is required" });
        }

        let targetChatId = chatId;
        let chat = null;

        if (targetChatId) {
            chat = await chatModel.findOne({ _id: targetChatId, user: req.user.id });
            if (!chat) {
                return res.status(404).json({ message: "Chat not found" });
            }
        } else {
            chat = await chatModel.create({ user: req.user.id, title: `Repo: ${repoUrl}` });
            targetChatId = chat._id;
        }

        const githubToken = await getUserGithubToken(req.user.id);
        const { owner, repo, branch, files } = await fetchRepoFiles(repoUrl, githubToken);

        if (files.length === 0) {
            return res.status(400).json({ message: "No indexable files found in this repo" });
        }

        const result = await storeTextChunks({
            texts: files.map((f) => ({ filename: f.filename, text: f.text })),
            userId: req.user.id,
            chatId: targetChatId,
        });

        const aiMessage = await messageModel.create({
            chat: targetChatId,
            content: `Connected repo ${owner}/${repo} (branch: ${branch}). Indexed ${result.files} files, ${result.chunks} chunks. Ask me anything about this codebase.`,
            role: "ai",
        });

        res.status(201).json({
            message: "Repo indexed successfully",
            chat,
            aiMessage,
            owner,
            repo,
            branch,
            filesIndexed: result.files,
            chunks: result.chunks,
        });
    } catch (error) {
        console.error("Error connecting repo:", error);
        res.status(500).json({ message: "Failed to index repo", error: error.message });
    }
}

export async function getChats(req, res) {
    const chats = await chatModel.find(
        req.user ? { user: req.user.id } : { guestId: req.guest.guestId }
    );

    res.status(200).json({
        message: "Chats retreived successfully",
        chats,
        // Guest quota/block state is authoritative on the server (tracked by
        // fingerprint) but the frontend only holds it in memory - it resets
        // to a default "5/5, not blocked" display on every page refresh.
        // Sending this back on every getChats call (called on Dashboard
        // mount) lets the UI re-sync with reality instead of showing stale
        // optimistic state after a reload.
        ...(req.user ? {} : {
            guestStatus: {
                messagesLeft: Math.max(0, GUEST_MESSAGE_LIMIT - req.guest.usage.messageCount),
                blocked: req.guest.usage.messageCount >= GUEST_MESSAGE_LIMIT,
            },
        }),
    });
}


export async function getMessages(req, res) {
    const { chatId } = req.params;

    const chat = await chatModel.findOne(
        req.user ? { _id: chatId, user: req.user.id } : { _id: chatId, guestId: req.guest.guestId }
    )

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    })

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    })
}


export async function renameChat(req, res) {

    const { chatId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Title is required",
            success: false,
        });
    }

    const chat = await chatModel.findOneAndUpdate(
        req.user ? { _id: chatId, user: req.user.id } : { _id: chatId, guestId: req.guest.guestId },
        { title: title.trim() },
        { new: true }
    );

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found",
            success: false,
        });
    }

    res.status(200).json({
        message: "Chat renamed successfully",
        success: true,
        chat,
    });
}


export async function deleteChat(req, res) {

    const { chatId } = req.params;

    const chat = await chatModel.findOneAndDelete(
        req.user ? { _id: chatId, user: req.user.id } : { _id: chatId, guestId: req.guest.guestId }
    )

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })

    try {
        await deleteChatVectors({ userId: req.user ? req.user.id : req.guest.guestId, chatId });
    } catch (vectorErr) {
        // Don't fail the delete if Pinecone cleanup errors (e.g. chat had no
        // vectors, or index unreachable) - the chat/messages are already gone.
        console.error("Failed to delete vector data for chat:", vectorErr.message);
    }

    res.status(200).json({
        message: "Chat deleted successfully"
    })
}