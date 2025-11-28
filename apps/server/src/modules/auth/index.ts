import { arktypeValidator } from '@hono/arktype-validator';
import { type } from 'arktype';
import { Hono } from 'hono';

import { db } from '@server/db';
import {
    ADMIN_PASSWORD,
    JWT_REFRESH_SECRET,
    JWT_SECRET,
} from '@server/utils/env';
import { BadRequestError } from '@server/utils/errorHandler';

import { Module, ModuleRepository } from '..';
import { Utils } from '../utils';
import { User, UserRole } from './types';

export class AuthModule implements Module {
    name = 'Auth';

    repo = () => {
        return new ModuleRepository<User>(db.getRepository(User));
    };

    init = async () => {
        await this.repo().addIfEmpty({
            username: 'admin',
            password: await Utils.hashPassword(ADMIN_PASSWORD),
            role: UserRole.ADMIN,
        });
    };

    health = async () => {
        await this.repo().count();
    };

    routes = () => {
        return new Hono().post(
            '/login',
            arktypeValidator(
                'form',
                type({ username: 'string', password: 'string' }),
            ),
            async (c) => {
                const { username, password } = c.req.valid('form');
                const user = await this.login(username, password);
                if (!user)
                    throw new BadRequestError(
                        'Identifiant ou mot de passe invalide',
                    );

                const tokens = await this.generateTokens(user);
                return c.json({
                    ...tokens,
                    user: { ...user.toDTO(), password: '*****' },
                });
            },
        );
    };

    // ---
    add = async (
        user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ) => {
        return this.repo().add({
            ...user,
            password: await Utils.hashPassword(user.password),
        });
    };

    // Authentication Methods
    login = async (
        username: string,
        password: string,
    ): Promise<User | null> => {
        const user = await this.repo().findOneBy({ username });
        if (!user || !(await Utils.comparePassword(password, user.password))) {
            return null;
        }
        return user;
    };

    generateTokens = async (user: User) => {
        const accessToken = await Utils.signToken(
            { username: user.username, role: user.role },
            JWT_SECRET,
        );
        const refreshToken = await Utils.signToken(
            { username: user.username },
            JWT_REFRESH_SECRET,
        );
        return { accessToken, refreshToken };
    };
}
