import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
    Column,
    DeepPartial,
    Entity,
    EntityTarget,
    FindOptionsWhere,
    PrimaryGeneratedColumn,
    Repository,
} from 'typeorm';
import z from 'zod';

import { AuthRole } from '@server/auth/auth.types';
import { authManager } from '@server/core';
import { AppDataSource, DbManager } from '@server/db';
import { GalleryStatus } from '@server/gallery/gallery.types';
import { NotFoundError, errorHandler } from '@server/tools/errorHandler';
import { logger } from '@server/tools/logger';

interface WithDefaultColumns {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

class Module<T extends WithDefaultColumns> {
    protected repo: Repository<T>;

    constructor(
        public name: string,
        public T: EntityTarget<T>,
    ) {
        this.repo = AppDataSource.getRepository(T);
    }

    // Health Check
    async health(): Promise<void> {
        const count = await this.repo.count();
        logger.info(`${this.name} health check: ${count} items found.`);
    }

    async init(): Promise<void> {
        return;
    }

    // CRUD Operations
    async all(): Promise<T[]> {
        return this.repo.find();
    }

    async get(id: number): Promise<T | null> {
        const item = await this.repo.findOneBy({ id } as FindOptionsWhere<T>);
        return item;
    }

    async add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
        const newItem = this.repo.create({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.repo.save(newItem);
        logger.info(`Added new item with ID: ${savedItem.id}`);
        return savedItem;
    }

    async edit(
        id: number,
        item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<T | null> {
        const existing = await this.repo.findOneBy({
            id,
        } as FindOptionsWhere<T>);
        if (!existing) {
            return null;
        }
        const updatedItem = this.repo.merge(existing, {
            ...item,
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.repo.save(updatedItem);
        logger.info(`Edited item with ID: ${savedItem.id}`);
        return savedItem;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repo.delete(id);
        return !!result.affected && result.affected > 0;
    }

    // Routes
    async routes() {
        const routes = new Hono()
            .onError(errorHandler)
            .get('/all', async (c) => {
                const items = await this.all();
                return c.json(items);
            })
            .get('/latest', async (c) => {
                const items = await this.all();
                const sortedItems = items.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                );
                const latestBlog = sortedItems[0];
                return c.json(latestBlog);
            })
            .get('/:id', async (c) => {
                const id = Number(c.req.param('id'));
                const item = await this.get(id);
                if (!item) {
                    throw new NotFoundError(
                        `Item ${this.name} ${id} not found`,
                    );
                }
                return c.json(item);
            });
        /*.post(
                '/add',
                authManager.authMiddleware(AuthRole.ADMIN),
                zValidator(
                    'form',
                    z.object({
                        title: z.string(),
                        content: z.string(),
                        author: z.string(),
                        status: z.enum(GalleryStatus),
                    }),
                ),
                async (c) => {
                    const item = c.req.valid('form');
                    const newItem = await this.add(item);
                    return c.json({ message: 'Item added', item: newItem });
                },
            )*/ return new Hono().route('/blog2', routes);
    }
}

export class BlogModule extends Module<Blog> {
    constructor() {
        super('Blog', Blog);
    }
}

@Entity('blogs')
export class Blog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    title: string = '';

    @Column('text', { nullable: false })
    content: string = '';

    @Column('text', { nullable: false })
    author: string = '';

    @Column('text', { nullable: false })
    status: GalleryStatus = GalleryStatus.DRAFT;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();
}
