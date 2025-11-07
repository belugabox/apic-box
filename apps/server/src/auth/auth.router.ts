import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { authManager } from '@server/core';
import { logger } from '@server/tools/logger';

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
        .onError((err, c) => {
            logger.error(err, 'router error');
            return c.json({ name: err.name, message: err.message }, 500);
        })
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
                    throw new Error('Invalid credentials');
                }
                const tokens = await authManager.generateTokens(user);
                return c.json({ ...tokens, user });
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
