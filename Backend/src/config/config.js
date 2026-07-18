import dotenv from "dotenv";
dotenv.config(); 

const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "IMAGEKIT_PRIVATE_KEY",
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`${key} is not defined in environment variables`);
    }
}

export const config = {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",

    // Origin of the frontend to redirect the browser back to..
    FRONTEND_URL: process.env.FRONTEND_URL || "",

   
    SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,

    // Database
    MONGO_URI: process.env.MONGO_URI,

    // Auth
    JWT_SECRET: process.env.JWT_SECRET,

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

    // ImageKit
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,

    // Redis
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // Mailjet
    MAILJET_API_KEY: process.env.MAILJET_API_KEY,
    MAILJET_API_SECRET: process.env.MAILJET_API_SECRET,
    MAILJET_SENDER_EMAIL: process.env.MAILJET_SENDER_EMAIL,
    MAILJET_SENDER_NAME: process.env.MAILJET_SENDER_NAME || "Kairis AI",

    // AI providers
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,

    // RAG / vector database (Pinecone)
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX: process.env.PINECONE_INDEX || "kairisa-ai-rag",
};
