const userRequestTracker = new Map();

/**
 * Custom in-memory rate limiter middleware per authenticated user.
 * @param {number} limit - Maximum allowed requests in the time window.
 * @param {number} windowMs - Time window in milliseconds.
 */
export function rateLimiter(limit = 15, windowMs = 60000) {
    return (req, res, next) => {
        const userId = req.user?.id;
        
        // If the request doesn't have a user context, skip (e.g. public routes, though these are authenticated)
        if (!userId) {
            return next();
        }

        const now = Date.now();
        const userData = userRequestTracker.get(userId) || { count: 0, resetTime: now + windowMs };

        // If the time window has passed, reset the counter
        if (now > userData.resetTime) {
            userData.count = 1;
            userData.resetTime = now + windowMs;
        } else {
            userData.count++;
        }

        userRequestTracker.set(userId, userData);

        // Check if limit exceeded
        if (userData.count > limit) {
            return res.status(429).json({
                message: "You have exceeded your message limit. Please wait a moment before sending more.",
                success: false,
                err: "Rate limit exceeded"
            });
        }

        next();
    };
}
