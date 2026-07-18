import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import { storeDocument, queryDocuments } from "../services/rag.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";




export async function sendMessage(req, res) {

    const { message, chat: chatId } = req.body;

    let title = null, chat = null;


    try {

        if (!chatId) {
            title = await generateChatTitle(message);
            chat = await chatModel.create({
                user: req.user.id,
                title
            });
        }

        const userMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: message,
            role: "user"
        });

        const messages = await messageModel.find({ chat: chatId || chat._id });

        
        let ragContext = "";
        try {
            const matches = await queryDocuments({ query: message, userId: req.user.id });
            ragContext = matches
                .map((m) => `[from "${m.filename}"]\n${m.text}`)
                .join("\n---\n");
        } catch (ragError) {
            console.error("RAG query failed, continuing without context:", ragError.message);
        }

        const result = await generateResponse(messages, ragContext);


        const aiMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: result,
            role: "ai"
        });


        res.status(201).json({
            title,
            chat,
            aiMessage,
        });

    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }

}

export async function uploadDocument(req, res) {

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { buffer, mimetype, originalname } = req.file;

        const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(mimetype)) {
            return res.status(400).json({ message: "Only PDF and image files (png, jpg, webp) are supported" });
        }

        const result = await storeDocument({
            buffer,
            mimetype,
            filename: originalname,
            userId: req.user.id,
        });

        res.status(201).json({
            message: "Document stored successfully",
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