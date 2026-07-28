import {Router} from "express";
import multer from "multer";
import { deleteChat, getChats, getMessages, renameChat, sendMessage, uploadDocument, connectRepo } from "../controllers/chat.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";
import { guestOrAuth } from "../middlewares/guest.middleware.js";
import { rateLimiter } from "../middlewares/rateLimit.middleware.js";

const chatRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });


chatRouter.post("/message", guestOrAuth, rateLimiter(15, 60000), sendMessage);

chatRouter.post("/upload", guestOrAuth, rateLimiter(5, 60000), upload.single("file"), uploadDocument);

chatRouter.post("/connect-repo", guestOrAuth, rateLimiter(3, 60000), connectRepo);

chatRouter.get("/", guestOrAuth, getChats);


chatRouter.get("/:chatId/messages", guestOrAuth, getMessages);

chatRouter.patch("/rename/:chatId", guestOrAuth, renameChat);

chatRouter.delete("/delete/:chatId", guestOrAuth, deleteChat)


export default chatRouter;
