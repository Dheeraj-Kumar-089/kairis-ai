import crypto from "crypto";
import { config } from "../config/config.js";
import guestUsageModel from "../models/guestUsage.model.js";
import jwt from "jsonwebtoken";

const GUEST_COOKIE = "guestId";
const GUEST_COOKIE_MAX_AGE = 400 * 24 * 60 * 60 * 1000; 


export async function guestOrAuth(req, res, next) {
    const token = req.cookies?.token;
    if (token) {
        try {
            req.user = jwt.verify(token, config.JWT_SECRET);
            return next();
        } catch (err) {
            
        }
    }

    try {
        let guestId = req.cookies?.[GUEST_COOKIE];
        if (!guestId) {
            guestId = crypto.randomUUID();
            res.cookie(GUEST_COOKIE, guestId, {
                httpOnly: true,
                secure: config.NODE_ENV === "production",
                sameSite: config.NODE_ENV === "production" ? "none" : "lax",
                maxAge: GUEST_COOKIE_MAX_AGE,
            });
        }

        const fingerprint = (req.headers["x-guest-fingerprint"] || "").toString().trim();

        let usage;
        if (fingerprint) {
            usage = await guestUsageModel.findOneAndUpdate(
                { fingerprint },
                { $addToSet: { guestIds: guestId } },
                { upsert: true, new: true }
            );
        } else {
            
            usage = await guestUsageModel.findOneAndUpdate(
                { fingerprint: `cookie:${guestId}` },
                { $addToSet: { guestIds: guestId } },
                { upsert: true, new: true }
            );
        }

        req.guest = { guestId, fingerprint, usage };
        next();
    } catch (err) {
        console.error("Guest identity resolution failed:", err.message);
        res.status(500).json({ message: "Failed to establish guest session" });
    }
}
