import { Context } from 'hono';

/**
 * Middleware de timeout global
 * Rejette les requêtes qui prennent plus de X ms
 */
export const timeoutMiddleware =
    (timeoutMs: number = 30000) =>
    async (c: Context, next: () => Promise<void>) => {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });

        try {
            await Promise.race([next(), timeoutPromise]);
        } catch (err) {
            if (err instanceof Error && err.message.includes('timeout')) {
                return c.json(
                    {
                        name: 'TimeoutError',
                        message: err.message,
                    },
                    408 as any,
                );
            }
            throw err;
        }
    };
