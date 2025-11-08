import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

import { AuthRole } from '@server/auth';
import { authManager, blogManager } from '@server/core';

export const blogRoutes = () =>
    new Hono()
        .get('/all', async (c) => {
            const blogs = await blogManager.all();
            return c.json(blogs);
        })
        .get('/:id', async (c) => {
            const { id } = c.req.param();
            const blog = await blogManager.get(id);
            if (!blog) {
                throw new Error('Blog not found');
            }
            return c.json(blog);
        })
        .post(
            '/add',
            authManager.authMiddleware(AuthRole.ADMIN),
            zValidator(
                'form',
                z.object({
                    title: z.string(),
                    content: z.string(),
                    author: z.string(),
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
                }),
            ),
            async (c) => {
                const blog = c.req.valid('form');
                const updatedBlog = await blogManager.updateBlog(blog);
                return c.json({ message: 'Blog updated', blog: updatedBlog });
            },
        )
        .post(
            '/delete/:id',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const id = Number(c.req.param('id'));
                await blogManager.deleteBlog(id);
                return c.json({ message: 'Blog deleted' });
            },
        );
