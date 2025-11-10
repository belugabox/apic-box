import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { AuthRole } from '@server/auth';
import { actionManager, authManager } from '@server/core';
import { logger } from '@server/tools/logger';

import { ActionStatus, ActionType } from './action.types';

export const actionRoutes = () =>
    new Hono()
        .get('/all', async (c) => {
            const actions = await actionManager.all();
            return c.json(actions);
        })
        .onError((err, c) => {
            logger.error(err, 'router error');
            return c.json({ name: err.name, message: err.message }, 500);
        })
        .post(
            '/add',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    name: z.string(),
                    description: z.string(),
                    type: z.enum(ActionType),
                    status: z.enum(ActionStatus),
                }),
            ),
            async (c) => {
                const action = c.req.valid('form');
                const newAction = await actionManager.add(action);
                return c.json({ message: 'Action created', action: newAction });
            },
        )
        .post(
            '/update',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    id: z.coerce.number(),
                    name: z.string(),
                    description: z.string(),
                    type: z.enum(ActionType),
                    status: z.enum(ActionStatus),
                }),
            ),
            async (c) => {
                const action = c.req.valid('form');
                const updatedAction = await actionManager.updateAction(action);
                return c.json({
                    message: 'Action updated',
                    action: updatedAction,
                });
            },
        )
        .delete(
            '/delete/:id',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const id = Number(c.req.param('id'));
                await actionManager.deleteAction(id);
                return c.json({ message: 'Action deleted' });
            },
        );
