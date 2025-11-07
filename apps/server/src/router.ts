import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { actionRoutes } from './action/action.router';
import { authRoutes } from './auth/auth.router';
import { logger } from './tools/logger';

export const router = () =>
    new Hono()
        .onError((err, c) => {
            logger.error(err, 'router error');
            return c.json({ name: err.name, message: err.message }, 500);
        })
        .route('/auth', authRoutes())
        .route('/actions', actionRoutes());
