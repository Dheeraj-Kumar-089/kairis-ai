import { Server} from "socket.io";
import { config } from "../config/config.js";

let io; 

export function initSocket(httpServer) {
    io = new Server(httpServer, {   
        cors: {
            
            origin: config.FRONTEND_URL || true,
            credentials: true,
        },

    });

    console.log("Socket.io server is running");

    io.on("connection", (socket) => {   
        console.log("A user connected", socket.id); 

    })
}


export function getIO(){  
    if(!io){
    throw new Error("Socket.io is not initialized")
    }
    return io;

}

