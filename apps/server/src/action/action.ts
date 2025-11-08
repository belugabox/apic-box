import { db, galleryManager } from '@server/core';
import { MappedRepository } from '@server/db';

import { Action } from './action.types';

type ActionRow = Omit<Action, 'createdAt' | 'updatedAt' | 'gallery'> & {
    createdAt: string;
    updatedAt: string;
};

export class ActionManager extends MappedRepository<ActionRow, Action> {
    constructor() {
        super(db, 'actions');
    }

    protected async mapToDomain(row: ActionRow): Promise<Action> {
        return {
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            gallery:
                row.type === 'gallery'
                    ? await galleryManager.get(`${row.id}`)
                    : undefined,
        };
    }

    init = async () => {
        await db.run(
            `CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY, 
                title TEXT NOT NULL, 
                description TEXT,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                createdAt datetime NOT NULL,
                updatedAt datetime NOT NULL
            );`,
        );
    };

    health = async () => {
        return await this.findOne({});
    };

    all = async (): Promise<Action[]> => {
        return this.findAll();
    };

    get = async (id: number): Promise<Action | undefined> => {
        return this.findById(id);
    };

    add = async (
        action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<Action> => {
        const result = await this.repo.create({
            title: action.title,
            description: action.description,
            type: action.type,
            status: action.status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        if (action.type === 'gallery' && result.lastID) {
            await galleryManager.add(`${result.lastID}`);
        }

        const created = await this.findById(result.lastID);
        return created!;
    };

    updateAction = async (
        action: Omit<Action, 'createdAt' | 'updatedAt'>,
    ): Promise<Action> => {
        await this.repo.update(action.id, {
            title: action.title,
            description: action.description,
            type: action.type,
            status: action.status,
            updatedAt: new Date().toISOString(),
        });

        if (action.type === 'gallery') {
            await galleryManager.add(`${action.id}`);
        }

        const updated = await this.findById(action.id);
        return updated!;
    };

    deleteAction = async (id: number): Promise<void> => {
        const action = await this.get(id);
        if (!action) return;

        await this.repo.delete(id);

        if (action.type === 'gallery') {
            await galleryManager.delete(`${action.id}`);
        }
    };
}
