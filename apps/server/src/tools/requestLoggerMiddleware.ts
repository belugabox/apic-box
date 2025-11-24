import { Context } from 'hono';

import { logger } from './logger';

interface RequestLog {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    timestamp: string;
    errorMessage?: string;
}

/**
 * Middleware de logging pour tracer toutes les requêtes/réponses
 * Log: method, path, status, duration
 */
export const requestLoggerMiddleware =
    () => async (c: Context, next: () => Promise<void>) => {
        const startTime = Date.now();
        const method = c.req.method;
        const path = new URL(c.req.url).pathname;

        try {
            await next();

            const duration = Date.now() - startTime;
            const status = c.res.status;

            const logEntry: RequestLog = {
                method,
                path,
                statusCode: status,
                duration,
                timestamp: new Date().toISOString(),
            };

            if (c.error) {
                logEntry.errorMessage = c.error.name + ' - ' + c.error.message;
            }

            // Log en fonction du status
            if (status >= 500) {
                logger.error(logEntry, `HTTP ${status}`);
            } else if (status >= 400) {
                logger.warn(logEntry, `HTTP ${status}`);
            } else {
                logger.debug(logEntry, `HTTP ${status}`);
            }
        } catch (err) {
            const duration = Date.now() - startTime;
            logger.error(
                {
                    method,
                    path,
                    duration,
                    error: err instanceof Error ? err.message : String(err),
                    timestamp: new Date().toISOString(),
                },
                'Request failed',
            );
            throw err;
        }
    };
