import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { AuthRole } from '@server/auth';
import { authManager, blogManager } from '@server/core';
import { EntityStatus } from '@server/modules/shared.types';
import { NotFoundError, errorHandler } from '@server/tools/errorHandler';

export const blogRoutes = () =>
    new Hono()
        .onError(errorHandler)
        .get('/all', async (c) => {
            const blogs = await blogManager.all(await authManager.isAdmin(c));
            return c.json(blogs);
        })
        .get('/latest', async (c) => {
            const blogs = await blogManager.all(await authManager.isAdmin(c));
            const sortedBlogs = blogs.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            );
            const latestBlog = sortedBlogs[0];
            return c.json(latestBlog);
        })
        .get(
            '/:id',
            zValidator(
                'param',
                z.object({
                    id: z.string(),
                }),
            ),
            async (c) => {
                const id = c.req.param('id');
                const blog = await blogManager.get(id);
                if (!blog) {
                    throw new NotFoundError(`Blog ${id} not found`);
                }
                return c.json(blog);
            },
        )
        .post(
            '/add',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    title: z.string(),
                    content: z.string(),
                    author: z.string(),
                    status: z.enum(EntityStatus),
                }),
            ),
            async (c) => {
                const blog = c.req.valid('form');
                const newBlog = await blogManager.add(blog);
                return c.json({ message: 'Blog added', blog: newBlog });
            },
        )
        .post(
            '/update',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    id: z.coerce.number(),
                    title: z.string(),
                    content: z.string(),
                    author: z.string(),
                    status: z.enum(EntityStatus),
                }),
            ),
            async (c) => {
                const blog = c.req.valid('form');
                const updatedBlog = await blogManager.updateBlog(blog);
                return c.json({ message: 'Blog updated', blog: updatedBlog });
            },
        )
        .delete(
            '/delete/:id',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'param',
                z.object({
                    id: z.string(),
                }),
            ),
            async (c) => {
                const id = c.req.param('id');
                const blog = await blogManager.get(id);
                if (!blog) {
                    throw new NotFoundError(`Blog ${id} not found`);
                }
                await blogManager.deleteBlog(id);
                return c.json({ message: 'Blog deleted' });
            },
        );
