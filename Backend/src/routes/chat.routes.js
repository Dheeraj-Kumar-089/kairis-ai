import {Router} from "express";
import multer from "multer";
import { deleteChat, getChats, getMessages, renameChat, sendMessage, uploadDocument } from "../controllers/chat.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

chatRouter.post("/message", authUser, sendMessage); 

chatRouter.post("/upload", authUser, upload.single("file"), uploadDocument);

chatRouter.get("/", authUser, getChats);


chatRouter.get("/:chatId/messages", authUser, getMessages);

chatRouter.patch("/rename/:chatId", authUser, renameChat);

chatRouter.delete("/delete/:chatId",authUser,deleteChat)


export default chatRouter;
