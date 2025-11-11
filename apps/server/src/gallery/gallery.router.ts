import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { AuthRole } from '@server/auth';
import { authManager, galleryManager } from '@server/core';
import {
    BadRequestError,
    NotFoundError,
    errorHandler,
} from '@server/tools/errorHandler';

export const galleryRoutes = () =>
    new Hono()
        .onError(errorHandler)
        .get(
            '/:galleryId',
            zValidator(
                'param',
                z.object({
                    galleryId: z.coerce.number(),
                }),
            ),
            async (c) => {
                const galleryId = Number(c.req.param('galleryId'));
                const gallery = await galleryManager.get(galleryId);
                if (!gallery) {
                    throw new NotFoundError(`Gallery ${galleryId} not found`);
                }
                return c.json(gallery);
            },
        )
        .get(
            '/album/:albumId',
            zValidator(
                'param',
                z.object({
                    albumId: z.coerce.number(),
                }),
            ),
            async (c) => {
                const albumId = Number(c.req.param('albumId'));
                const album = await galleryManager.getAlbum(albumId);
                if (!album) {
                    throw new NotFoundError(`Album ${albumId} not found`);
                }
                return c.json(album);
            },
        )
        .get(
            '/image/:imageId/thumbnail',
            zValidator(
                'param',
                z.object({
                    imageId: z.coerce.number(),
                }),
            ),
            zValidator(
                'query',
                z.object({
                    v: z.string().optional(),
                }),
            ),
            async (c) => {
                const imageId = Number(c.req.param('imageId'));
                // Le query param 'v' est un cache buster (timestamp) - il est ignoré
                const thumbnail = await galleryManager.getImageBuffer(
                    imageId,
                    true,
                );
                if (!thumbnail) {
                    throw new NotFoundError(
                        `Thumbnail for image ${imageId} not found`,
                    );
                }
                c.header('Content-Type', 'image/jpeg');
                c.header(
                    'Cache-Control',
                    'public, max-age=31536000, immutable',
                );
                return c.body(new Uint8Array(thumbnail));
            },
        )
        .post(
            '/addAlbum',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    galleryId: z.coerce.number(),
                    name: z.string(),
                }),
            ),
            async (c) => {
                const { galleryId, name } = c.req.valid('form');
                await galleryManager.addAlbum(galleryId, name);
                return c.json({ message: 'Album added' });
            },
        )
        .post(
            '/deleteAlbum',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    albumId: z.coerce.number(),
                }),
            ),
            async (c) => {
                const { albumId } = c.req.valid('form');
                await galleryManager.deleteAlbum(albumId);
                return c.json({ message: 'Album deleted' });
            },
        )
        .post(
            '/addImages',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const formData = await c.req.formData();

                const albumId = z.coerce
                    .number()
                    .parse(formData.get('albumId'));
                const files = formData.getAll('files') as File[];

                if (!files || files.length === 0) {
                    throw new BadRequestError('No files provided');
                }

                await galleryManager.addImages(albumId, files);
                return c.json({ message: 'Images added' });
            },
        )
        .post(
            '/deleteImage',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    imageId: z.coerce.number(),
                }),
            ),
            async (c) => {
                const { imageId } = c.req.valid('form');
                await galleryManager.deleteImage(imageId);
                return c.json({ message: 'Image deleted' });
            },
        );
