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

import { GalleryStatus } from './gallery.types';

export const galleryRoutes = () =>
    new Hono()
        .onError(errorHandler)
        .get('/all', async (c) => {
            const galleries = await galleryManager.all(
                await authManager.isAdmin(c),
            );
            return c.json(galleries);
        })
        .get(
            '/:galleryId',
            galleryManager.checkAccess(),
            zValidator(
                'param',
                z.object({
                    galleryId: z.coerce.number(),
                }),
            ),
            async (c) => {
                const galleryId = Number(c.req.param('galleryId'));
                const gallery = await galleryManager.get(
                    galleryId,
                    await authManager.isAdmin(c),
                );
                if (!gallery) {
                    throw new NotFoundError(`Gallery ${galleryId} not found`);
                }
                return c.json(gallery);
            },
        )
        .post(
            '/add',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    name: z.string(),
                    description: z.string(),
                    status: z.enum(GalleryStatus),
                }),
            ),
            async (c) => {
                const { name, description, status } = c.req.valid('form');
                await galleryManager.add({
                    name,
                    description,
                    status,
                });
                return c.json({ message: 'Gallery added' });
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
                    status: z.enum(GalleryStatus),
                }),
            ),
            async (c) => {
                const gallery = c.req.valid('form');
                const updatedGallery = await galleryManager.update(gallery);
                return c.json({
                    message: 'Gallery updated',
                    gallery: updatedGallery,
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
                const gallery = await galleryManager.get(id, true);
                if (!gallery) {
                    throw new NotFoundError(`Gallery ${id} not found`);
                }
                await galleryManager.delete(id);
                return c.json({ message: 'Gallery deleted' });
            },
        )
        .post(
            '/updatePassword',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    galleryId: z.coerce.number(),
                    password: z.string().optional(),
                }),
            ),
            async (c) => {
                const { galleryId, password } = c.req.valid('form');
                if (!password || password === '') {
                    await galleryManager.removePassword(galleryId);
                    return c.json({ message: 'Password removed' });
                }
                await galleryManager.setPassword(galleryId, password);
                return c.json({ message: 'Password updated' });
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
            '/login',
            zValidator(
                'form',
                z.object({
                    galleryId: z.coerce.number(),
                    password: z.string(),
                }),
            ),
            async (c) => {
                const { galleryId, password } = c.req.valid('form');
                const token = await galleryManager.login(galleryId, password);
                return c.json({ token });
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
