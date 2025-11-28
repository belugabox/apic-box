import { Context } from 'hono';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS } from '../utils/env';
import { logger } from '../utils/logger';

// Initialiser le rate limiter
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'api',
    points: RATE_LIMIT_REQUESTS, // Number of requests
    duration: Math.floor(RATE_LIMIT_WINDOW_MS / 1000), // Per second
});

/**
 * Middleware de rate limiting
 * Limite le nombre de requêtes par IP dans une fenêtre de temps donnée
 */
export const rateLimitMiddleware = async (
    c: Context,
    next: () => Promise<void>,
) => {
    const ip =
        c.req.header('CF-Connecting-IP') ||
        c.req.header('X-Forwarded-For') ||
        c.req.header('X-Real-IP') ||
        'unknown';

    try {
        await rateLimiter.consume(ip);
        await next();
    } catch (rejRes: any) {
        const msBeforeNext = rejRes.msBeforeNext;
        logger.warn({ ip, msBeforeNext }, 'Rate limit exceeded');
        c.header('Retry-After', Math.round(msBeforeNext / 1000).toString());
        return c.json(
            {
                error: 'Too many requests',
                retryAfter: Math.round(msBeforeNext / 1000),
            },
            429,
        );
    }
};
