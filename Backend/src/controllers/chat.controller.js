import { generateResponse, generateChatTitle, generateSummary } from "../services/ai.service.js";
import { storeDocument, queryDocuments } from "../services/rag.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import userModel from "../models/user.model.js";


export async function sendMessage(req, res) {
    const { message, chat: chatId, attachments } = req.body;
    let title = null, chat = null;

    try {
        // 1. Verify chat message limit
        if (chatId) {
            const existingMessageCount = await messageModel.countDocuments({ chat: chatId });
            if (existingMessageCount >= 35) {
                return res.status(403).json({ 
                    error: "Chat limit reached. This chat session is closed (max 35 messages). Please switch to a new chat." 
                });
            }
        }

        // 2. Fetch/Create Chat
        if (!chatId) {
            title = await generateChatTitle(message);
            chat = await chatModel.create({
                user: req.user.id,
                title
            });
        }

        const activeChatId = chatId || chat._id;
        const activeChat = chat || await chatModel.findById(activeChatId);

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

        // 5. Update User Daily Usage Count
        const user = await userModel.findById(req.user.id);
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

        // 8. Fetch RAG Context if document uploaded
        let ragContext = "";
        try {
            const matches = await queryDocuments({ query: message, userId: req.user.id });
            ragContext = matches
                .map((m) => `[from "${m.filename}"]\n${m.text}`)
                .join("\n---\n");
        } catch (ragError) {
            console.error("RAG query failed, continuing without context:", ragError.message);
        }

        // 9. Choose model with fallbacks
        let responseText = null;
        let errorLog = [];
        let modelQueue = [];

        if (user.messageCountToday <= 20) {
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

        res.status(201).json({
            title,
            chat: activeChat,
            aiMessage,
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

        // Check single file size (5MB limit)
        if (size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File size exceeds the 5MB limit." });
        }

        const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(mimetype)) {
            return res.status(400).json({ message: "Only PDF and image files (png, jpg, webp) are supported" });
        }

        // Upload to ImageKit (CDN), with a fallback to local disk storage
        let fileUrl = "";
        const userId = req.user.id;
        const targetChatId = chatId || "general";
        const folderPath = `/kairis-ai/${userId}/${targetChatId}`;

        try {
            const authHeader = Buffer.from(config.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
            const base64File = buffer.toString("base64");

            const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${authHeader}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    file: base64File,
                    fileName: originalname,
                    useUniqueFileName: true,
                    folder: folderPath
                })
            });

            if (!uploadResponse.ok) {
                const errText = await uploadResponse.text();
                throw new Error(`ImageKit response status ${uploadResponse.status}: ${errText}`);
            }

            const uploadData = await uploadResponse.json();
            fileUrl = uploadData.url;
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
            userId: req.user.id,
        });

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

export async function getChats(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user.id });

    res.status(200).json({
        message: "Chats retreived successfully",
        chats
    });
}


export async function getMessages(req, res) {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

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
        { _id: chatId, user: req.user.id },
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

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    await messageModel.deleteMany({
        chat: chatId
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    res.status(200).json({
        message: "Chat deleted successfully"
    })
}