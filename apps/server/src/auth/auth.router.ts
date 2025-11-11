import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { authManager } from '@server/core';
import { BadRequestError, errorHandler } from '@server/tools/errorHandler';

import { AuthRole } from './auth.types';

export const authRoutes = () =>
    new Hono<{
        Variables: {
            user: {
                username: string;
                role: AuthRole;
            };
        };
    }>()
        .onError(errorHandler)
        .post(
            '/login',
            zValidator(
                'form',
                z.object({
                    username: z.string(),
                    password: z.string(),
                }),
            ),
            async (c) => {
                const { username, password } = c.req.valid('form');

                const user = await authManager.login(username, password);
                if (!user) {
                    throw new BadRequestError('Invalid credentials');
                }
                const tokens = await authManager.generateTokens(user);
                return c.json({
                    ...tokens,
                    user: { ...user, password: '*****' },
                });
            },
        )
        .post('/logout', authManager.authMiddleware(), async (c) => {
            const user = c.get('user');
            // Implémente une logique pour invalider le token de rafraîchissement si nécessaire
            return c.json({ message: 'Logged out', user });
        })
        .get(
            '/users',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const users = await authManager.all();
                return c.json(users);
            },
        );
