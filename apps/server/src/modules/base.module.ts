import { arktypeValidator } from '@hono/arktype-validator';
import { Type } from 'arktype';
import { Hono } from 'hono';
import {
    DeepPartial,
    EntityTarget,
    FindOptionsWhere,
    Repository,
} from 'typeorm';

import { AuthRole } from '@server/auth/auth.types';
import { authManager } from '@server/core';
import { AppDataSource } from '@server/db';
import { NotFoundError, errorHandler } from '@server/tools/errorHandler';
import { logger } from '@server/tools/logger';

export interface EntityWithDefaultColumns {
    id: number;
    createdAt: Date;
    updatedAt: Date;

    toDTO: () => object;
}

type AddType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>;
type EditType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>>;

// Generic Module Class
export class BaseModule<T extends EntityWithDefaultColumns> {
    protected repo!: Repository<T>;

    constructor(
        public name: string,
        public T: EntityTarget<T>,
        public addSchema: Type<AddType<T>>,
        public editSchema: Type<EditType<T>>,
    ) {}

    // Initialization & Health Check
    async init(): Promise<void> {
        this.repo = AppDataSource.getRepository(this.T);
        return;
    }

    async health(): Promise<void> {
        await this.repo.count();
        return;
    }

    // CRUD Operations
    async all(_isAdmin?: boolean): Promise<T[]> {
        return this.repo.find();
    }

    async get(id: number, _isAdmin?: boolean): Promise<T | null> {
        const item = await this.repo.findOneBy({ id } as FindOptionsWhere<T>);
        return item;
    }

    async add(item: AddType<T>): Promise<T> {
        const newItem = this.repo.create({
            ...item,
            id: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.repo.save(newItem);
        logger.info({ item: savedItem }, `${this.name} > add`);
        return savedItem;
    }

    async edit(id: number, item: EditType<T>): Promise<T | null> {
        const existing = await this.repo.findOneBy({
            id,
        } as FindOptionsWhere<T>);
        if (!existing) {
            logger.warn(`${this.name} ${id} not found for edit`);
            return null;
        }
        const updatedItem = this.repo.merge(existing, {
            ...item,
            updatedAt: new Date(),
        } as DeepPartial<T>);
        const savedItem = await this.repo.save(updatedItem);
        logger.info({ item: savedItem }, `${this.name} > edit`);
        return savedItem;
    }

    async addIfEmpty(item: AddType<T>): Promise<T | null> {
        if ((await this.repo.count()) > 0) return null;
        return this.add(item);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repo.delete(id);
        return !!result.affected && result.affected > 0;
    }

    // Routes
    routes() {
        const routes = new Hono()
            .onError(errorHandler)
            .all('/', async (c) => {
                const items = await this.all();
                return c.json(items.map((i) => i.toDTO()));
            })
            .get('/all', async (c) => {
                const items = await this.all();
                return c.json(items.map((i) => i.toDTO()));
            })
            .get('/latest', async (c) => {
                const items = await this.all();
                const sortedItems = items.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                );
                const latestBlog = sortedItems[0];
                return c.json(latestBlog.toDTO());
            })
            .get('/:id', async (c) => {
                const id = Number(c.req.param('id'));
                const item = await this.get(id);
                if (!item) {
                    throw new NotFoundError(
                        `Item ${this.name} ${id} not found`,
                    );
                }
                return c.json(item.toDTO());
            })
            .post(
                '/add',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator('form', this.addSchema),
                async (c) => {
                    const formData = c.req.valid('form');
                    const newItem = await this.add(formData as AddType<T>);
                    return c.json({
                        message: 'Item added',
                        item: newItem.toDTO(),
                    });
                },
            )
            .patch(
                '/:id',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator('form', this.editSchema),
                async (c) => {
                    const formData = c.req.valid('form');
                    const id = Number(c.req.param('id'));
                    const updatedItem = await this.edit(
                        id,
                        formData as EditType<T>,
                    );
                    if (!updatedItem) {
                        throw new NotFoundError(
                            `Item ${this.name} ${id} not found`,
                        );
                    }
                    return c.json({
                        message: 'Item edited',
                        item: updatedItem.toDTO(),
                    });
                },
            )
            .delete(
                '/:id',
                authManager.authMiddleware(AuthRole.ADMIN),
                async (c) => {
                    const id = Number(c.req.param('id'));
                    const success = await this.delete(id);
                    if (!success) {
                        throw new NotFoundError(
                            `Item ${this.name} ${id} not found`,
                        );
                    }
                    return c.json({ message: 'Item deleted' });
                },
            );
        return routes;
    }
}
