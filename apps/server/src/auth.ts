import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import jwt from 'jsonwebtoken';

import { findUser, verifyPassword } from './users';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';
const REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET ||
    'your_refresh_token_secret_key_change_this';

export interface UserPayload {
    username: string;
    role: 'admin' | 'user';
}

export const generateTokens = (user: UserPayload) => {
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
        return null;
    }
};

export const verifyRefreshToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as UserPayload;
    } catch (error) {
        return null;
    }
};

export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 10);
};

export const authMiddleware = () => {
    return async (c: Context, next: () => Promise<void>) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const user = verifyAccessToken(token);
        if (!user) {
            return c.json({ message: 'Invalid or expired token' }, 401);
        }

        c.set('user', user);
        await next();
    };
};

export const adminMiddleware = () => {
    return async (c: Context, next: () => Promise<void>) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const user = verifyAccessToken(token);
        if (!user) {
            return c.json({ message: 'Invalid or expired token' }, 401);
        }

        if (user.role !== 'admin') {
            return c.json(
                { message: 'Forbidden - Admin access required' },
                403,
            );
        }

        c.set('user', user);
        await next();
    };
};

export const authenticateUser = (
    username: string,
    password: string,
): UserPayload | null => {
    const user = findUser(username);
    if (!user) {
        return null;
    }

    if (!verifyPassword(user.password, password)) {
        return null;
    }

    return {
        username: user.username,
        role: user.role,
    };
};
