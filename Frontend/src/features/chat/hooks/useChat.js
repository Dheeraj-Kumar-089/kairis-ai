import { initializeSocketConnection } from "../services/chat.socket";
import { useDispatch } from "react-redux";
import { sendMessage, getChats, getMessages, deleteChat as deleteChatApi, renameChat as renameChatApi, uploadDocument, connectRepo } from "../services/chat.api.js";
import { setChats, setCurrentChatId, setError, setLoading, createNewChat, addNewMessage, addMessages, removeChat, renameChatTitle, replaceTempChatId, setGuestMessagesLeft, setGuestBlocked } from "../chat.slice";


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
            const { chat, aiMessage, guestMessagesLeft } = data;

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

            if (guestMessagesLeft !== undefined) {
                dispatch(setGuestMessagesLeft(guestMessagesLeft));
            }
        } catch (error) {
            dispatch(setError(error.response?.data?.error || error.response?.data?.message || "Failed to send message"));
            if (error.response?.data?.code === "GUEST_LIMIT_REACHED") {
                dispatch(setGuestBlocked(true));
                dispatch(setGuestMessagesLeft(0));
            }
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
        const { chats, guestStatus } = data;
        dispatch(setChats(chats.reduce((acc, chat) => {
            acc[chat._id] = {
                id: chat._id,
                title: chat.title,
                messages: [],
                lastUpdated: chat.updatedAt
            };
            return acc;
        }, {})));
        if (guestStatus) {
            dispatch(setGuestMessagesLeft(guestStatus.messagesLeft));
            dispatch(setGuestBlocked(guestStatus.blocked));
        }
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
                attachments: msg.attachments || [],
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

    async function handleConnectRepo(repoUrl, chatId) {
        const data = await connectRepo(repoUrl, chatId);
        const { chat, aiMessage } = data;

        if (!chatId) {
            dispatch(createNewChat({ chatId: chat._id, title: chat.title }));
            dispatch(setCurrentChatId(chat._id));
        }

        dispatch(addNewMessage({
            chatId: chat._id,
            content: aiMessage.content,
            role: aiMessage.role,
        }));

        return data;
    }

    return {

        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleDeleteChat,
        handleNewChat,
        handleRenameChat,
        handleUploadDocument,
        handleConnectRepo
    }



}