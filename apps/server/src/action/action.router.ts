import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { AuthRole } from '@server/auth';
import { actionManager, authManager } from '@server/core';
import { NotFoundError, errorHandler } from '@server/tools/errorHandler';

import { ActionStatus, ActionType } from './action.types';

export const actionRoutes = () =>
    new Hono()
        .onError(errorHandler)
        .get('/all', async (c) => {
            const limit = Math.min(Number(c.req.query('limit')) || 50, 500);
            const offset = Number(c.req.query('offset')) || 0;

            const actions = await actionManager.all();
            const paginated = actions.slice(offset, offset + limit);

            return c.json({
                data: paginated,
                total: actions.length,
                limit,
                offset,
            });
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
            zValidator(
                'param',
                z.object({
                    id: z.coerce.number(),
                }),
            ),
            async (c) => {
                const id = Number(c.req.param('id'));
                const action = await actionManager.get(id);
                if (!action) {
                    throw new NotFoundError(`Action ${id} not found`);
                }
                await actionManager.deleteAction(id);
                return c.json({ message: 'Action deleted' });
            },
        );
