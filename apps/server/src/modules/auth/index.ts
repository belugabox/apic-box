import { arktypeValidator } from '@hono/arktype-validator';
import bcrypt from 'bcryptjs';
import { Context, Hono } from 'hono';
import { sign, verify } from 'hono/jwt';

import {
    ADMIN_PASSWORD,
    JWT_REFRESH_SECRET,
    JWT_SECRET,
} from '@server/tools/env';
import {
    BadRequestError,
    ForbiddenError,
    UnauthorizedError,
} from '@server/tools/errorHandler';

import { BaseModule } from '../base.module';
import {
    User,
    UserAddSchema,
    UserEditSchema,
    UserLoginSchema,
    UserRole,
} from './types';

export class AuthModule extends BaseModule<User> {
    constructor() {
        super('Auth', User, UserAddSchema, UserEditSchema);
    }

    init = async (): Promise<void> => {
        await super.init();

        // Add default user if table is empty
        await this.addIfEmpty({
            username: 'admin',
            password: ADMIN_PASSWORD,
            role: UserRole.ADMIN,
        });
    };

    // CRUD Operations
    add = async (
        user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return super.add({
            ...user,
            password: hashedPassword,
        });
    };

    // Authentication Methods
    login = async (
        username: string,
        password: string,
    ): Promise<User | null> => {
        const user = await this.repo.findOneBy({ username });
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
        return payload as { username: string; role: UserRole };
    };

    verifyRefreshToken = async (token: string) => {
        const payload = await verify(token, JWT_REFRESH_SECRET);
        return payload as { username: string; role: UserRole };
    };

    //
    isAdmin = async (c: Context): Promise<boolean> => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return false;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return false;
        }
        const payload = await this.verifyAccessToken(token);
        return payload && payload.role === UserRole.ADMIN;
    };
    authMiddleware =
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
                const payload = await this.verifyAccessToken(token);
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

    // routes
    routes() {
        return new Hono().post(
            '/login',
            arktypeValidator('form', UserLoginSchema),
            async (c) => {
                const { username, password } = c.req.valid('form');

                const user = await this.login(username, password);
                if (!user) {
                    throw new BadRequestError(
                        'Identifiant ou mot de passe invalide',
                    );
                }
                const tokens = await this.generateTokens(user);
                return c.json({
                    ...tokens,
                    user: { ...user, password: '*****' },
                });
            },
        );
    }
}
