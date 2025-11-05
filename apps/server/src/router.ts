import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import {
    adminMiddleware,
    authMiddleware,
    authenticateUser,
    generateTokens,
    verifyRefreshToken,
} from './auth';
import { EventRegistrationSchema, EventSchema } from './types';
import { createAdminIfNoneExists, loadUsers } from './users';

// Initialize admin user if none exists
createAdminIfNoneExists();

// Mock database
const events: any[] = [];
const registrations: any[] = [];

export const router = () =>
    new Hono()
        .get('/health', (c) => {
            return c.json({ status: 'ok' });
        })
        // Auth routes (PUBLIC)
        .post(
            '/auth/login',
            zValidator(
                'json',
                z.object({
                    username: z.string(),
                    password: z.string(),
                }),
            ),
            (c) => {
                const { username, password } = c.req.valid('json');
                const user = authenticateUser(username, password);
                if (!user) {
                    return c.json({ message: 'Invalid credentials' }, 401);
                }
                const tokens = generateTokens(user);
                return c.json({
                    ...tokens,
                    user,
                });
            },
        )
        .post(
            '/auth/refresh',
            zValidator(
                'json',
                z.object({
                    refreshToken: z.string(),
                }),
            ),
            (c) => {
                const { refreshToken } = c.req.valid('json');
                const user = verifyRefreshToken(refreshToken);
                if (!user) {
                    return c.json({ message: 'Invalid refresh token' }, 401);
                }
                const tokens = generateTokens(user);
                return c.json(tokens);
            },
        )
        // Events routes (PUBLIC)
        .get('/events', (c) => {
            return c.json(events);
        })
        .post(
            '/events/:id/register',
            zValidator(
                'json',
                EventRegistrationSchema.omit({ id: true, registeredAt: true }),
            ),
            (c) => {
                const eventId = c.req.param('id');
                const event = events.find((e) => e.id === eventId);
                if (!event) {
                    return c.json({ message: 'Event not found' }, 404);
                }

                const data = c.req.valid('json');
                const registration = {
                    ...data,
                    id: Math.random().toString(36).substring(7),
                    registeredAt: new Date(),
                };
                registrations.push(registration);
                return c.json(registration, 201);
            },
        )
        .get('/events/:id/registrations', (c) => {
            const eventId = c.req.param('id');
            const eventRegistrations = registrations.filter(
                (r) => r.eventId === eventId,
            );
            return c.json(eventRegistrations);
        })
        // Admin routes (PROTECTED)
        .post(
            '/admin/events',
            authMiddleware(),
            adminMiddleware(),
            zValidator('json', EventSchema),
            (c) => {
                const event = c.req.valid('json');
                const newEvent = {
                    ...event,
                    id: Math.random().toString(36).substring(7),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                events.push(newEvent);
                return c.json(newEvent, 201);
            },
        )
        .get('/admin/events', authMiddleware(), adminMiddleware(), (c) => {
            return c.json(events);
        })
        .get('/admin/events/:id', authMiddleware(), adminMiddleware(), (c) => {
            const id = c.req.param('id');
            const event = events.find((e) => e.id === id);
            if (!event) {
                return c.json({ message: 'Event not found' }, 404);
            }
            return c.json(event);
        })
        .post(
            '/admin/users',
            authMiddleware(),
            adminMiddleware(),
            zValidator(
                'json',
                z.object({
                    username: z.string(),
                    password: z.string(),
                    role: z.enum(['admin', 'user']).default('user'),
                }),
            ),
            (c) => {
                // TODO: Implement user creation
                return c.json({ message: 'User creation not yet implemented' });
            },
        )
        .get('/admin/users', authMiddleware(), adminMiddleware(), (c) => {
            const users = loadUsers();
            // Return users without passwords
            const safeUsers = users.map((u) => ({
                username: u.username,
                role: u.role,
            }));
            return c.json(safeUsers);
        });
