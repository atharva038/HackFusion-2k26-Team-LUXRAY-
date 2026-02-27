import { incrementRateCounter } from '../services/cache.service.js';
import logger from '../utils/logger.js';

/**
 * Redis-backed rate limiter middleware factory.
 * Limits requests per authenticated user (falls back to IP if not authenticated).
 * Degrades gracefully — if Redis is down, all requests are allowed through.
 *
 * @param {object} options
 * @param {string}  options.prefix    - Route identifier (e.g. 'chat', 'tts')
 * @param {number}  options.max       - Max requests per window
 * @param {number}  options.windowMs  - Window duration in milliseconds
 */
export const createRedisRateLimiter = ({ prefix, max, windowMs }) => {
    const windowSecs = Math.ceil(windowMs / 1000);

    return async (req, res, next) => {
        // Use authenticated userId if available, else fall back to IP
        const identifier = req.user?.id || req.ip || 'anonymous';

        try {
            const count = await incrementRateCounter(prefix, identifier, windowSecs);

            // If Redis is down, count is null → allow through (graceful degradation)
            if (count === null) {
                return next();
            }

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

            if (count > max) {
                logger.warn(`[RateLimit] ${prefix} limit exceeded for ${identifier} (${count}/${max})`);
                return res.status(429).json({
                    error: `Too many requests. Please wait before sending more ${prefix} requests.`,
                });
            }

            next();
        } catch (err) {
            // Never block on rate limiter error
            logger.error(`[RateLimit] Unexpected error: ${err.message}`);
            next();
        }
    };
};
