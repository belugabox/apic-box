import { arktypeValidator } from '@hono/arktype-validator';
import { type } from 'arktype';
import { Hono } from 'hono';

import { db } from '@server/db';
import { NotFoundError } from '@server/utils/errorHandler';

import { Module } from '..';
import { UserRole } from '../auth/types';
import { ModuleRepository } from '../module-repository';
import { EntityStatus } from '../shared.types';
import { Utils } from '../utils';
import { Blog } from './types';

export class BlogModule implements Module {
    name = 'Blog';

    repo = () => {
        return new ModuleRepository<Blog>(db.getRepository(Blog));
    };

    init = async () => {
        await this.repo().addIfEmpty({
            title: `Bienvenue sur le site de l'APIC Sentelette !`,
            content: `L'association des parents d'élèves de Sains-en-Amienois, Saint-Fuscien et Estrées-sur-Noye.`,
            author: 'APIC',
            status: EntityStatus.PUBLISHED,
        });
    };

    health = async () => {
        await this.repo().count();
    };

    routes = () => {
        return new Hono()
            .get('/all', async (c) => {
                const isAdmin = await Utils.authIsAdmin(c);
                return c.json({
                    blogs: (await this.all(isAdmin)).map((blog) =>
                        blog.toDTO(),
                    ),
                });
            })
            .get('/latest', async (c) => {
                const isAdmin = await Utils.authIsAdmin(c);
                return c.json({ blog: (await this.latest(isAdmin))?.toDTO() });
            })
            .get(
                '/:id',
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const isAdmin = await Utils.authIsAdmin(c);
                    const blog = await this.get(id, isAdmin);
                    if (!blog) {
                        throw new NotFoundError(`Blog ${id} not found`);
                    }
                    return c.json({ blog: blog.toDTO() });
                },
            )
            .post(
                '/add',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        title: 'string',
                        content: 'string',
                        author: 'string',
                        status: type.valueOf(EntityStatus),
                    }),
                ),
                async (c) => {
                    const blog = c.req.valid('form');
                    return c.json({ blog: (await this.add(blog)).toDTO() });
                },
            )
            .patch(
                '/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        title: 'string',
                        content: 'string',
                        author: 'string',
                        status: type.valueOf(EntityStatus),
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const blog = c.req.valid('form');
                    const updated = await this.edit(id, blog);
                    if (!updated) {
                        throw new NotFoundError(`Blog ${id} not found`);
                    }
                    return c.json({ blog: updated.toDTO() });
                },
            )
            .delete(
                '/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const success = await this.delete(id);
                    if (!success) {
                        throw new NotFoundError(`Blog ${id} not found`);
                    }
                    return c.json({ success });
                },
            );
    };

    // ---
    private wherePublished(isAdmin?: boolean) {
        return !isAdmin ? { status: EntityStatus.PUBLISHED } : {};
    }

    // ---
    async all(isAdmin?: boolean): Promise<Blog[]> {
        return this.repo().all(this.wherePublished(isAdmin));
    }

    async latest(isAdmin?: boolean): Promise<Blog | null> {
        return await this.repo().latest(this.wherePublished(isAdmin));
    }

    async get(id: number, isAdmin?: boolean): Promise<Blog | null> {
        const blog = await this.repo().get(id, this.wherePublished(isAdmin));
        if (!blog) return null;
        return blog;
    }

    async add(blog: {
        title: string;
        content: string;
        author: string;
        status: EntityStatus;
    }): Promise<Blog> {
        return this.repo().add(blog);
    }

    async edit(
        id: number,
        blog: {
            title: string;
            content: string;
            author: string;
            status: EntityStatus;
        },
    ): Promise<Blog | null> {
        return this.repo().edit(id, blog);
    }

    async delete(id: number): Promise<boolean> {
        return this.repo().deleteById(id);
    }
}
