import { initializeSocketConnection } from "../services/chat.socket";
import { useDispatch } from "react-redux";
import { sendMessage, getChats, getMessages, deleteChat as deleteChatApi, renameChat as renameChatApi, uploadDocument } from "../services/chat.api.js";
import { setChats, setCurrentChatId, setError, setLoading, createNewChat, addNewMessage, addMessages, removeChat, renameChatTitle, replaceTempChatId } from "../chat.slice";


export function useChat() {
    const dispatch = useDispatch();

    async function handleSendMessage({ message, chatId, attachments = [] }) {
        const isNewChat = !chatId;
        const activeChatId = isNewChat ? "temp-chat-id" : chatId;

        if (isNewChat) {
            dispatch(createNewChat({
                chatId: activeChatId,
                title: message || "New Chat",
            }));
            dispatch(setCurrentChatId(activeChatId));
        }

        // Instantly show user message
        dispatch(addNewMessage({
            chatId: activeChatId,
            content: message,
            role: "user",
            attachments: attachments
        }));

        dispatch(setLoading(true));
        try {
            const data = await sendMessage({ message, chatId: isNewChat ? null : chatId, attachments });
            const { chat, aiMessage } = data;

            if (isNewChat) {
                dispatch(replaceTempChatId({
                    tempId: activeChatId,
                    realId: chat._id,
                    title: chat.title,
                }));
            }

            dispatch(addNewMessage({
                chatId: chat._id,
                content: aiMessage.content,
                role: aiMessage.role,
                streaming: true,
            }));
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to send message"));
            if (isNewChat) {
                dispatch(removeChat(activeChatId));
            }
        } finally {
            dispatch(setLoading(false));
        }
    }


    async function handleGetChats() {
        dispatch(setLoading(true));
        const data = await getChats();
        const { chats } = data;
        dispatch(setChats(chats.reduce((acc, chat) => {
            acc[chat._id] = {
                id: chat._id,
                title: chat.title,
                messages: [],
                lastUpdated: chat.updatedAt
            };
            return acc;
        }, {})));
        dispatch(setLoading(false));
    }

    async function handleOpenChat(chatId,chats) {


        if (chats[chatId]?.messages.length === 0) {
            const data = await getMessages(chatId);
            const { messages } = data;

            const formattedMessages = messages.map(msg => ({
                content: msg.content,
                role: msg.role,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                fileType: msg.fileType,
            }));

            dispatch(addMessages({
                chatId,
                messages: formattedMessages,
            }));
        }
        dispatch(setCurrentChatId(chatId));
    }

    async function handleDeleteChat(chatId) {
        await deleteChatApi(chatId);
        dispatch(removeChat(chatId));
    }

    function handleNewChat() {
        dispatch(setCurrentChatId(null));
    }

    async function handleRenameChat(chatId, title) {
        await renameChatApi(chatId, title);
        dispatch(renameChatTitle({ chatId, title }));
    }

    async function handleUploadDocument(file, chatId) {
        return await uploadDocument(file, chatId);
    }

    return {

        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleDeleteChat,
        handleNewChat,
        handleRenameChat,
        handleUploadDocument
    }



}