import "dotenv/config";
import app from "./src/app.js";
import connectToDB from "./src/config/database.js";
import http from "http"
import {initSocket} from "./src/sockets/server.socket.js"

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app); // create a new http server instance using the express app
initSocket(httpServer); // initialize the socket.io server with the http server instance




connectToDB()
    .catch((error) => {
        console.log("Error connecting to database", error); // exits the process if database connection fails
    });

httpServer.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})