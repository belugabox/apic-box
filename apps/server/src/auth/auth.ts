import bcrypt from 'bcryptjs';
import fs from 'fs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import jwt from 'jsonwebtoken';
import path from 'path';

import { db } from '@server/core';
import { logger } from '@server/tools/logger';

import { AuthRole, User } from './auth.types';

const USERS_FILE = path.resolve(
    process.env.CONFIG_FILE_PATH ?? './config',
    'users.json',
);
export const JWT_SECRET =
    process.env.JWT_SECRET || 'apic-box-secret-key-change-in-production';
export const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    'apic-box-refresh-secret-key-change-in-production';

export class AuthManager {
    constructor() {}
    init = async () => {
        await db.run(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY, 
                username TEXT NOT NULL, 
                password TEXT NOT NULL,
                role TEXT NOT NULL
            );`,
        );
        const emptyTable = await db.get<{ count: number }>(
            'SELECT COUNT(*) as count FROM users',
        );
        if (emptyTable.count <= 0) {
            const result = await this.add({
                id: 0,
                username: 'admin',
                password: 'admin',
                role: AuthRole.ADMIN,
            });
            logger.info(
                `Default admin user created with username: "admin" and password: "admin"`,
            );
        }
    };

    health = async () => {
        return await db.run('SELECT id FROM users LIMIT 1').then(() => {
            return;
        });
    };

    all = async (): Promise<User[]> => {
        const users = await db.all<User>(
            'SELECT id, username, password, role FROM users',
        );
        return users;
    };

    get = async (username: string): Promise<User | null> => {
        const user = await db.get<User>(
            'SELECT id, username, password, role FROM users WHERE username = ?',
            [username],
        );
        return user || null;
    };

    add = async (user: User): Promise<User> => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [user.username, hashedPassword, user.role],
        );
        logger.info(`Added user result: ${JSON.stringify(result)}`);
        return { ...user, id: result.lastID ?? 0, password: hashedPassword };
    };

    update = async (user: User): Promise<User> => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await db.run(
            'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
            [user.username, hashedPassword, user.role, user.id],
        );
        logger.info(`Updated user result: ${JSON.stringify(result)}`);
        return { ...user, password: hashedPassword };
    };

    delete = async (id: number): Promise<void> => {
        await db.run('DELETE FROM users WHERE id = ?', [id]);
    };

    // ---
    login = async (
        username: string,
        password: string,
    ): Promise<User | null> => {
        const user = await this.get(username);
        if (!user) {
            return null;
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return null;
        }
        return user;
    };

    generateTokens = async (user: User) => {
        const accessToken = await sign(
            { username: user.username, role: user.role },
            JWT_SECRET,
        );
        const refreshToken = await sign(
            { username: user.username },
            JWT_REFRESH_SECRET,
        );
        return { accessToken, refreshToken };
    };

    verifyAccessToken = async (token: string) => {
        const payload = await verify(token, JWT_SECRET);
        return payload as { username: string; role: AuthRole };
    };

    verifyRefreshToken = async (token: string) => {
        const payload = await verify(token, JWT_REFRESH_SECRET);
        return payload as { username: string; role: AuthRole };
    };

    // ---
    authMiddleware =
        (role?: AuthRole) => async (c: Context, next: () => Promise<void>) => {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                return c.json({ message: 'Unauthorized' }, 401);
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return c.json({ message: 'Unauthorized' }, 401);
            }

            try {
                const payload = await this.verifyAccessToken(token);
                if (!payload || !payload.role) {
                    return c.json({ message: 'Invalid token payload' }, 401);
                }
                if (role && payload.role !== role) {
                    return c.json({ message: 'Forbidden' }, 403);
                }
                c.set('user', payload);
            } catch (err) {
                logger.error(err, 'Token verification failed');
                return c.json({ message: 'Invalid or expired token' }, 401);
            }

            return await next();
        };
}
