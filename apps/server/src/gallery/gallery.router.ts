import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

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
        .get('/:galleryName', async (c) => {
            const { galleryName } = c.req.param();
            const gallery = galleryManager.galleries.find(
                (g) => g.name === galleryName,
            );
            if (!gallery) {
                throw new Error('Gallery not found');
            }
            return c.json(gallery);
        })
        .get('/:galleryName/:filename', async (c) => {
            const { galleryName, filename } = c.req.param();
            const file = await galleryManager.getImage(galleryName, filename);
            if (!file) {
                throw new Error('Image not found');
            }

            c.header('Content-Type', 'image/jpeg');
            c.header('Cache-Control', 'public, max-age=31536000');
            return c.body(new Uint8Array(file));
        })
        .post(
            '/add',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    galleryName: z.string(),
                    albumName: z.string(),
                    files: z.array(z.instanceof(File)),
                }),
            ),
            async (c) => {
                const { galleryName, albumName, files } = c.req.valid('form');
                try {
                    await galleryManager.addImages(
                        galleryName,
                        albumName,
                        files,
                    );
                    return c.json({
                        message: 'Images added',
                        gallery: galleryName,
                        album: albumName,
                        count: files.length,
                    });
                } catch (error) {
                    logger.error(error, 'Error adding images');
                    return c.json({ error: 'Failed to add images' }, 500);
                }
            },
        );
