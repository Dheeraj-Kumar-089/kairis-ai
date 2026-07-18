import { api } from "../../auth/services/auth.api.js"


export const sendMessage = async ({message,chatId}) => {

    const response = await api.post("api/chats/message",{
        message,chat: chatId
    })

    return response.data;
}

export const getChats = async ()=>{
    const response = await api.get("api/chats");
    return response.data;
}

export const getMessages = async (chatId)=>{
    const response = await api.get(`api/chats/${chatId}/messages`);
    return response.data;
}


export const deleteChat = async (chatId)=>{
    const response = await api.delete(`api/chats/delete/${chatId}`);
    return response.data;
}

export const renameChat = async (chatId, title) => {
    const response = await api.patch(`api/chats/rename/${chatId}`, { title });
    return response.data;
}

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("api/chats/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
}