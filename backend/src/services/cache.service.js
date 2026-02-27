import { createHash } from 'crypto';
import redisClient, { isRedisReady } from '../config/redis.js';
import logger from '../utils/logger.js';

// ── TTLs ──────────────────────────────────────────────────────────────────────
const TTL_TRANSLATION = 3600;      // 1 hour
const TTL_TTS = 86400;     // 24 hours
const TTL_SESSION = 1800;      // 30 minutes

// ── Key helpers ───────────────────────────────────────────────────────────────
const md5 = (text) => createHash('md5').update(text).digest('hex');

const keys = {
    translation: (dir, lang, text) => `translation:${dir}:${lang}:${md5(text)}`,
    tts: (lang, text) => `tts:${lang}:${md5(text)}`,
    session: (sessionId) => `session:${sessionId}`,
    rate: (prefix, userId) => `rate:${prefix}:${userId}`,
};

// ── Observability ─────────────────────────────────────────────────────────────
const redisLog = (operation, key, hit, latencyMs, userId = '') => {
    logger.info(`[Redis] ${operation} ${key} hit=${hit} latency=${latencyMs}ms${userId ? ` user=${userId}` : ''}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣  TRANSLATION CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a cached translation.
 * @param {'toEn'|'fromEn'} dir - Translation direction
 * @param {string} lang - Language code
 * @param {string} originalText - The original text that was translated
 * @returns {Promise<string|null>} Translated text or null on miss/error
 */
export async function getCachedTranslation(dir, lang, originalText) {
    if (!isRedisReady()) return null;
    const key = keys.translation(dir, lang, originalText);
    const start = Date.now();
    try {
        const cached = await redisClient.get(key);
        redisLog('GET', key, !!cached, Date.now() - start);
        return cached || null;
    } catch (err) {
        logger.error(`[Redis] getCachedTranslation error: ${err.message}`);
        return null;
    }
}

/**
 * Store a translation in cache (fire-and-forget).
 * @param {'toEn'|'fromEn'} dir
 * @param {string} lang
 * @param {string} originalText
 * @param {string} translatedText
 */
export function setCachedTranslation(dir, lang, originalText, translatedText) {
    if (!isRedisReady()) return;
    const key = keys.translation(dir, lang, originalText);
    const start = Date.now();
    redisClient.set(key, translatedText, { EX: TTL_TRANSLATION })
        .then(() => redisLog('SET', key, false, Date.now() - start))
        .catch((err) => logger.error(`[Redis] setCachedTranslation error: ${err.message}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣  TTS AUDIO CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get cached TTS audio as a Buffer.
 * Audio is stored as base64 string to handle binary in Redis GET/SET.
 * @param {string} lang
 * @param {string} text
 * @returns {Promise<Buffer|null>}
 */
export async function getCachedTTS(lang, text) {
    if (!isRedisReady()) return null;
    const key = keys.tts(lang, text);
    const start = Date.now();
    try {
        const b64 = await redisClient.get(key);
        redisLog('GET', key, !!b64, Date.now() - start);
        if (!b64) return null;
        return Buffer.from(b64, 'base64');
    } catch (err) {
        logger.error(`[Redis] getCachedTTS error: ${err.message}`);
        return null;
    }
}

/**
 * Store TTS audio buffer in cache (fire-and-forget).
 * @param {string} lang
 * @param {string} text
 * @param {Buffer} audioBuffer
 */
export function setCachedTTS(lang, text, audioBuffer) {
    if (!isRedisReady()) return;
    const key = keys.tts(lang, text);
    const start = Date.now();
    const b64 = audioBuffer.toString('base64');
    redisClient.set(key, b64, { EX: TTL_TTS })
        .then(() => redisLog('SET', key, false, Date.now() - start))
        .catch((err) => logger.error(`[Redis] setCachedTTS error: ${err.message}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣  SESSION MEMORY CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get session message history from Redis.
 * @param {string} sessionId
 * @returns {Promise<Array<{role:string, content:string}>|null>}
 */
export async function getSessionHistory(sessionId) {
    if (!isRedisReady()) return null;
    const key = keys.session(sessionId);
    const start = Date.now();
    try {
        const raw = await redisClient.lRange(key, 0, -1);
        redisLog('GET', key, raw.length > 0, Date.now() - start);
        if (!raw || raw.length === 0) return null;
        return raw.map((msg) => JSON.parse(msg));
    } catch (err) {
        logger.error(`[Redis] getSessionHistory error: ${err.message}`);
        return null;
    }
}

/**
 * Append a message to session history and refresh TTL.
 * @param {string} sessionId
 * @param {'user'|'ai'} role
 * @param {string} content
 */
export async function appendSessionMessages(sessionId, messages) {
    if (!isRedisReady()) return;
    const key = keys.session(sessionId);
    const start = Date.now();
    try {
        const serialised = messages.map((m) => JSON.stringify(m));
        await redisClient.rPush(key, serialised);
        await redisClient.expire(key, TTL_SESSION);
        redisLog('RPUSH', key, false, Date.now() - start);
    } catch (err) {
        logger.error(`[Redis] appendSessionMessages error: ${err.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣  RATE LIMITING HELPERS (used by redisRateLimiter middleware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Increment request counter for userId under a named route prefix.
 * Returns the new count, or null if Redis is unavailable.
 * @param {string} prefix - e.g. 'chat', 'tts'
 * @param {string} userId
 * @param {number} windowSecs - Window duration in seconds
 * @returns {Promise<number|null>}
 */
export async function incrementRateCounter(prefix, userId, windowSecs) {
    if (!isRedisReady()) return null;
    const key = keys.rate(prefix, userId);
    try {
        const count = await redisClient.incr(key);
        if (count === 1) {
            // First request in window — set expiry
            await redisClient.expire(key, windowSecs);
        }
        return count;
    } catch (err) {
        logger.error(`[Redis] incrementRateCounter error: ${err.message}`);
        return null;
    }
}
