import { createClient } from 'redis';
import logger from '../utils/logger.js';

// ── Redis Client ──────────────────────────────────────────────────────────────
// Reads REDIS_URL from env (supports local, Redis Cloud, Upstash).
// Fails gracefully — if Redis is unavailable, the system continues without cache.

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            // Back off exponentially, cap at 30s. Stop after 5 attempts.
            if (retries > 5) {
                logger.warn('[Redis] Max reconnect attempts reached — running without cache.');
                return false; // Stop reconnecting
            }
            return Math.min(retries * 500, 30_000);
        },
    },
});

// Expose connection state so services can skip cache operations when down
let _ready = false;

client.on('connect', () => {
    logger.info('[Redis] Connected ✓');
    _ready = true;
});

client.on('ready', () => {
    _ready = true;
});

client.on('error', (err) => {
    _ready = false;
    logger.error(`[Redis] Error: ${err.message}`);
});

client.on('end', () => {
    _ready = false;
    logger.warn('[Redis] Connection closed');
});

// Connect (non-blocking — server starts even if Redis is unavailable)
client.connect().catch((err) => {
    logger.warn(`[Redis] Initial connection failed: ${err.message} — running without cache.`);
    _ready = false;
});

/**
 * Returns true if Redis is connected and ready for commands.
 */
export const isRedisReady = () => _ready && client.isOpen;

/**
 * Gracefully close the Redis connection (called during server shutdown).
 */
export const closeRedis = async () => {
    if (client.isOpen) {
        await client.quit();
        logger.info('[Redis] Disconnected gracefully');
    }
};

export default client;
