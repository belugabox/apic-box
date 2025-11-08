import { Hono } from 'hono';

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
        .post('/add', authManager.authMiddleware(AuthRole.ADMIN), async (c) => {
            const { id, title, content, author } = await c.req.json();
            await blogManager.add({ id, title, content, author });
            return c.json({ message: 'Blog added' });
        })
        .post(
            '/update',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const blog = await c.req.json();
                await blogManager.update(blog);
                return c.json({ message: 'Blog updated' });
            },
        )
        .post(
            '/delete',
            authManager.authMiddleware(AuthRole.ADMIN),
            async (c) => {
                const { id } = await c.req.json();
                await blogManager.delete(id);
                return c.json({ message: 'Blog deleted' });
            },
        );
