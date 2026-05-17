// Rate limiting middleware using sliding window algorithm

const rateLimitStore = new Map();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // Max requests per window

function cleanExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > WINDOW_MS) {
            rateLimitStore.delete(key);
        }
    }
}

// Clean expired entries every 5 minutes
setInterval(cleanExpiredEntries, 5 * 60 * 1000);

export function rateLimit(req, res, next) {
    // Use IP address or user ID as the key
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record) {
        record = { windowStart: now, count: 0 };
        rateLimitStore.set(key, record);
    }

    // Reset window if expired
    if (now - record.windowStart > WINDOW_MS) {
        record.windowStart = now;
        record.count = 0;
    }

    record.count++;

    // Set rate limit headers
    res.set({
        'X-RateLimit-Limit': MAX_REQUESTS,
        'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - record.count),
        'X-RateLimit-Reset': new Date(record.windowStart + WINDOW_MS).toISOString()
    });

    if (record.count > MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((record.windowStart + WINDOW_MS - now) / 1000)
        });
    }

    next();
}

// Stricter rate limit for admin operations
export function adminRateLimit(req, res, next) {
    const key = `admin:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record) {
        record = { windowStart: now, count: 0 };
        rateLimitStore.set(key, record);
    }

    if (now - record.windowStart > WINDOW_MS) {
        record.windowStart = now;
        record.count = 0;
    }

    record.count++;

    res.set({
        'X-RateLimit-Limit': 30,
        'X-RateLimit-Remaining': Math.max(0, 30 - record.count),
        'X-RateLimit-Reset': new Date(record.windowStart + WINDOW_MS).toISOString()
    });

    if (record.count > 30) {
        return res.status(429).json({
            success: false,
            error: 'Too many admin requests. Please try again later.',
            retryAfter: Math.ceil((record.windowStart + WINDOW_MS - now) / 1000)
        });
    }

    next();
}