import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { AuthRole } from '@server/auth';
import { authManager, galleryManager } from '@server/core';
import { logger } from '@server/tools/logger';

export const galleryRoutes = () =>
    new Hono()
        .onError((err, c) => {
            logger.error(err, 'router error');
            return c.json({ name: err.name, message: err.message }, 500);
        })
        .get('/all', async (c) => {
            const galleries = galleryManager.galleries;
            return c.json(galleries);
        })
        .get('/:galleryName', galleryManager.checkAccess(), async (c) => {
            const { galleryName } = c.req.param();

            const gallery = galleryManager.galleries.find(
                (g) => g.name === galleryName,
            );
            if (!gallery) {
                throw new Error('Gallery not found');
            }
            return c.json(gallery);
        })
        .get(
            '/:galleryName/:filename',
            galleryManager.checkAccess(),
            async (c) => {
                const { galleryName, filename } = c.req.param();
                const file = await galleryManager.getImage(
                    galleryName,
                    filename,
                );
                if (!file) {
                    throw new Error('Image not found');
                }
                c.header('Content-Type', 'image/jpeg');
                c.header('Cache-Control', 'public, max-age=31536000');
                return c.body(new Uint8Array(file));
            },
        )
        .get(
            '/:galleryName/:filename/raw',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const { galleryName, filename } = c.req.param();
                const file = await galleryManager.getImage(
                    galleryName,
                    filename,
                    true,
                );
                if (!file) {
                    throw new Error('Image not found');
                }
                c.header('Content-Type', 'image/jpeg');
                c.header('Cache-Control', 'public, max-age=31536000');
                return c.body(new Uint8Array(file));
            },
        )
        .post('/add', authManager.authMiddleware(AuthRole.ADMIN), async (c) => {
            const formData = await c.req.formData();
            const galleryName = formData.get('galleryName') as string;
            const albumName = formData.get('albumName') as string;
            const files = formData.getAll('files') as File[];

            if (!galleryName || !albumName || files.length === 0) {
                throw new Error('Missing required fields');
            }

            await galleryManager.addImages(galleryName, albumName, files);
            return c.json({
                message: 'Images added',
                gallery: galleryName,
                album: albumName,
                count: files.length,
            });
        })
        // Routes de protection des galeries
        .post(
            '/:galleryName/protect',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'json',
                z.object({
                    password: z.string().min(4, 'Password too short'),
                }),
            ),
            async (c) => {
                const { galleryName } = c.req.param();
                const { password } = c.req.valid('json');

                await galleryManager.setPassword(galleryName, password);
                return c.json({
                    message: 'Gallery protected',
                    gallery: galleryName,
                });
            },
        )
        .post(
            '/:galleryName/unprotect',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const { galleryName } = c.req.param();

                await galleryManager.removePassword(galleryName);
                return c.json({
                    message: 'Gallery unprotected',
                    gallery: galleryName,
                });
            },
        )
        .get('/:galleryName/is-protected', async (c) => {
            const { galleryName } = c.req.param();

            const isProtected = await galleryManager.isProtected(galleryName);
            return c.json({
                gallery: galleryName,
                isProtected,
            });
        })
        .post(
            '/:galleryName/unlock',
            zValidator(
                'json',
                z.object({
                    password: z.string(),
                }),
            ),
            async (c) => {
                const { galleryName } = c.req.param();
                const { password } = c.req.valid('json');

                const token = await galleryManager.login(galleryName, password);

                if (!token) {
                    return c.json(
                        {
                            message:
                                'Invalid password or gallery not protected',
                        },
                        401,
                    );
                }

                return c.json({
                    message: 'Gallery unlocked',
                    token,
                });
            },
        );
