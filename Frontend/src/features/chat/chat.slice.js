import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name:"chat",
    initialState:{
        chats:{},
        currentChatId:null,
        isLoading:null,
        error:null
    },
    reducers:{
        createNewChat:(state,action)=>{
            const {chatId, title} = action.payload
            state.chats[chatId]={
                id:chatId,
                title,
                messages:[],
                lastUpdated:new Date().toISOString(),
            }
        },
        addNewMessage:(state,action)=>{
            const { chatId,content,role,streaming}= action.payload
            state.chats[chatId].messages.push({content,role,streaming: !!streaming})
        },
        addMessages:(state,action)=>{
            const {chatId,messages} = action.payload
            state.chats[chatId].messages.push(...messages)
        },
        setChats:(state,action)=>{
            state.chats = action.payload
        },
        setCurrentChatId:(state,action)=>{
            state.currentChatId=action.payload
        },
        setLoading:(state,action)=>{
            state.isLoading=action.payload
        },
        setError:(state,action)=>{
            state.error=action.payload
        },
        removeChat:(state,action)=>{
            const chatId = action.payload
            delete state.chats[chatId]
            if(state.currentChatId === chatId){
                state.currentChatId = null
            }
        },
        renameChatTitle:(state,action)=>{
            const { chatId, title } = action.payload
            if(state.chats[chatId]){
                state.chats[chatId].title = title
            }
        },
        markLastMessageDoneStreaming:(state,action)=>{
            const chatId = action.payload
            const messages = state.chats[chatId]?.messages
            if(messages && messages.length){
                messages[messages.length - 1].streaming = false
            }
        },
        replaceTempChatId:(state,action)=>{
            const { tempId, realId, title } = action.payload
            if (state.chats[tempId]) {
                const tempChat = state.chats[tempId]
                state.chats[realId] = {
                    id: realId,
                    title: title || tempChat.title,
                    messages: tempChat.messages,
                    lastUpdated: new Date().toISOString(),
                }
                delete state.chats[tempId]
            }
            if (state.currentChatId === tempId) {
                state.currentChatId = realId
            }
        },
        resetChatState:(state)=>{
            state.chats = {}
            state.currentChatId = null
            state.isLoading = null
            state.error = null
        }
    }
})

export const { setChats, setCurrentChatId, setLoading, setError, createNewChat, addNewMessage, addMessages, removeChat, renameChatTitle, markLastMessageDoneStreaming, replaceTempChatId, resetChatState } = chatSlice.actions
export default chatSlice.reducer
