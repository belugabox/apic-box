import { arktypeValidator } from '@hono/arktype-validator';
import { Type } from 'arktype';
import { Hono } from 'hono';
import { EntityTarget } from 'typeorm';

import { db } from '@server/db';
import { NotFoundError, errorHandler } from '@server/utils/errorHandler';

import { UserRole } from './auth/types';
import { ModuleRepository } from './module-repository';
import { Utils } from './utils';

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
    protected repo!: ModuleRepository<T>;

    constructor(
        public name: string,
        public T: EntityTarget<T>,
        public addSchema: Type<AddType<T>>,
        public editSchema: Type<EditType<T>>,
    ) {}

    // Initialization & Health Check
    async init(): Promise<void> {
        this.repo = new ModuleRepository<T>(db.getRepository(this.T));
        return;
    }

    async health(): Promise<void> {
        await this.repo.count();
        return;
    }

    // CRUD Operations
    async all(_isAdmin?: boolean): Promise<T[]> {
        return this.repo.all();
    }

    async latest(): Promise<T | null> {
        return this.repo.latest();
    }

    async get(id: number, _isAdmin?: boolean): Promise<T | null> {
        return this.repo.get(id);
    }

    async add(item: AddType<T>): Promise<T> {
        return this.repo.add(item);
    }

    async edit(id: number, item: EditType<T>): Promise<T | null> {
        return this.repo.edit(id, item);
    }

    async addIfEmpty(item: AddType<T>): Promise<T | null> {
        return this.repo.addIfEmpty(item);
    }

    async delete(id: number): Promise<boolean> {
        return this.repo.deleteById(id);
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
                const item = await this.latest();
                return c.json(item?.toDTO());
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
                Utils.authMiddleware(UserRole.ADMIN),
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
                Utils.authMiddleware(UserRole.ADMIN),
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
            .delete('/:id', Utils.authMiddleware(UserRole.ADMIN), async (c) => {
                const id = Number(c.req.param('id'));
                const success = await this.delete(id);
                if (!success) {
                    throw new NotFoundError(
                        `Item ${this.name} ${id} not found`,
                    );
                }
                return c.json({ message: 'Item deleted' });
            });
        return routes;
    }
}
