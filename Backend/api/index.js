import "dotenv/config";
import app from "../src/app.js";
import connectToDB from "../src/config/database.js";

// Reuse the DB connection across warm serverless invocations instead of
// reconnecting on every request.
let dbConnected = false;

async function ensureDB() {
    if (!dbConnected) {
        await connectToDB();
        dbConnected = true;
    }
}

export default async function handler(req, res) {
    await ensureDB();
    return app(req, res);
}

