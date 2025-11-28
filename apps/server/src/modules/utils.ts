import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';

import { JWT_SECRET } from '@server/utils/env';
import { ForbiddenError, UnauthorizedError } from '@server/utils/errorHandler';

import { UserRole } from './auth/types';

export namespace Utils {
    export const hashPassword = async (password: string) => {
        return await bcrypt.hash(password, 10);
    };

    export const comparePassword = async (password: string, hash: string) => {
        return await bcrypt.compare(password, hash);
    };

    export const signToken = async (
        payload: Record<string, unknown>,
        jwt_secret: string,
    ) => {
        const token = await sign(payload, jwt_secret);
        return token;
    };

    export const verifyToken = async <T>(token: string, jwt_secret: string) => {
        const payload = await verify(token, jwt_secret);
        return payload as T;
    };

    // Admin check middleware
    export const authIsAdmin = async (c: Context): Promise<boolean> => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return false;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return false;
        }
        const payload = await Utils.verifyToken<{
            username: string;
            role: UserRole;
        }>(token, JWT_SECRET);
        return payload && payload.role === UserRole.ADMIN;
    };

    export const authMiddleware =
        (role?: UserRole) => async (c: Context, next: () => Promise<void>) => {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                throw new UnauthorizedError('Aucun token fourni');
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new UnauthorizedError('Aucun token fourni');
            }

            try {
                const payload = await Utils.verifyToken<{
                    username: string;
                    role: UserRole;
                }>(token, JWT_SECRET);
                if (!payload || !payload.role) {
                    throw new UnauthorizedError('Token invalide ou expiré');
                }
                if (role && payload.role !== role) {
                    throw new ForbiddenError('Permissions insuffisantes');
                }
                c.set('user', payload);
            } catch (err) {
                throw new UnauthorizedError('Token invalide ou expiré');
            }

            return await next();
        };
}
