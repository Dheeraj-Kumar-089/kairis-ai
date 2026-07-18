import{ io } from "socket.io-client";

export const initializeSocketConnection = () => {

  
    const socket = io(import.meta.env.VITE_API_BASE_URL || undefined, {
        withCredentials: true,
    })

    socket.on("connect", () => {
        console.log("Connected to socket.io server");
    })

}