import { Context } from 'hono';
import { ZodError } from 'zod';

import { logger } from './logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(400, message);
        this.name = 'BadRequestError';
    }
}

export const errorHandler = (err: Error, c: Context) => {
    logger.error(err, 'Request error');

    // Gestion des erreurs Zod (validation)
    if (err instanceof ZodError) {
        return c.json(
            {
                name: 'ValidationError',
                message: 'Validation failed',
            },
            400 as any,
        );
    }

    // Gestion des erreurs personnalisées
    if (err instanceof AppError) {
        return c.json(
            {
                name: err.name,
                message: err.message,
            },
            err.statusCode as any,
        );
    }

    // Gestion des erreurs par défaut
    return c.json(
        {
            name: err.name || 'InternalServerError',
            message: err.message || 'An unexpected error occurred',
        },
        500 as any,
    );
};
