import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import morgan from "morgan";
import cors from "cors";
import chatRouter from "./routes/chat.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { config } from "./config/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public"); // Backend/public 

const app = express();



//Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.use(morgan("dev")); 
app.use(cors({
    origin: config.FRONTEND_URL || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}))

app.use(express.static(publicDir));




app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}))



app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});


//Routes
app.use("/api/auth",authRouter);
app.use("/api/chats",chatRouter);


app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
        if (err) next();
    });
});

// Global error handler 
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Something went wrong",
        success: false,
    });
});

export default app;