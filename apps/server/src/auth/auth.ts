import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';

import { db } from '@server/core';
import { MappedRepository } from '@server/db';
import { logger } from '@server/tools/logger';

import { AuthRole, User } from './auth.types';

type UserRow = Omit<User, 'role'> & {
    role: string;
};

export const JWT_SECRET =
    process.env.JWT_SECRET || 'apic-box-secret-key-change-in-production';
export const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    'apic-box-refresh-secret-key-change-in-production';

export class AuthManager extends MappedRepository<UserRow, User> {
    constructor() {
        super(db, 'user');
    }

    protected async initializeSchema(): Promise<void> {
        await db.run(`
            CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY, 
                username TEXT NOT NULL, 
                password TEXT NOT NULL,
                role TEXT NOT NULL
            );
        `);
    }

    protected mapToDomain(row: UserRow): User {
        return {
            ...row,
            role: row.role as AuthRole,
        };
    }

    init = async () => {
        const emptyTable = await db.get<{ count: number }>(
            'SELECT COUNT(*) as count FROM user',
        );
        if (emptyTable && emptyTable.count <= 0) {
            await this.add({
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
        const result = await this.findOne({});
        return result ? 'healthy' : 'healthy';
    };

    all = async (): Promise<User[]> => {
        return this.findAll();
    };

    get = async (username: string): Promise<User | null> => {
        const user = await this.findOne({ username });
        return user || null;
    };

    add = async (user: User): Promise<User> => {
        logger.info(`Creating user: ${user.username} (role: ${user.role})`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await this.repo.create({
            username: user.username,
            password: hashedPassword,
            role: user.role,
        });
        logger.info(`User created with ID: ${result.lastID}`);
        return {
            ...user,
            id: result.lastID ?? 0,
            password: hashedPassword,
        };
    };

    updateUser = async (user: User): Promise<User> => {
        logger.info(`Updating user: ${user.username}`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await this.repo.update(user.id, {
            username: user.username,
            password: hashedPassword,
            role: user.role,
        });
        logger.info(`User updated: ${user.username}`);
        return { ...user, password: hashedPassword };
    };

    deleteUser = async (id: number): Promise<void> => {
        logger.info(`Deleting user with ID: ${id}`);
        await this.repo.delete(id);
        logger.info(`User deleted: ${id}`);
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
