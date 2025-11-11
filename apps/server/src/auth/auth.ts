import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';

import { db } from '@server/db';
import { MappedRepository } from '@server/db';
import { ForbiddenError, UnauthorizedError } from '@server/tools/errorHandler';
import { logger } from '@server/tools/logger';

import { AuthRole, User } from './auth.types';

type UserRow = Omit<User, 'role'> & {
    role: string;
};

export let JWT_SECRET: string;
export let JWT_REFRESH_SECRET: string;

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET environment variables are required',
    );
}

JWT_SECRET = process.env.JWT_SECRET;
JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

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
            const defaultAdminPassword =
                process.env.ADMIN_PASSWORD ||
                (() => {
                    throw new Error(
                        'ADMIN_PASSWORD environment variable is required for first setup',
                    );
                })();

            await this.add({
                id: 0,
                username: 'admin',
                password: defaultAdminPassword,
                role: AuthRole.ADMIN,
            });
            logger.info(`Default admin user created with username: "admin"`);
        }
    };

    health = async () => {
        try {
            const result = await this.findOne({});
            return result ? 'healthy' : 'healthy';
        } catch (err) {
            logger.error(err, 'AuthManager health check failed');
            throw err;
        }
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

    updateUser = async (
        user: User,
        currentPassword?: string,
    ): Promise<User> => {
        logger.info(`Updating user: ${user.username}`);

        // Vérifier l'ancien mot de passe si fourni
        if (currentPassword) {
            const existingUser = await this.findById(user.id);
            if (!existingUser) {
                throw new Error(`User ${user.id} not found`);
            }
            const passwordMatch = await bcrypt.compare(
                currentPassword,
                existingUser.password,
            );
            if (!passwordMatch) {
                throw new Error('Current password is incorrect');
            }
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        await this.repo.update(user.id, {
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
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new UnauthorizedError('No token provided');
            }

            try {
                const payload = await this.verifyAccessToken(token);
                if (!payload || !payload.role) {
                    throw new UnauthorizedError('Invalid or expired token');
                }
                if (role && payload.role !== role) {
                    throw new ForbiddenError('Insufficient permissions');
                }
                c.set('user', payload);
            } catch (err) {
                logger.error(err, 'Token verification failed');
                throw new UnauthorizedError('Invalid or expired token');
            }

            return await next();
        };
}
