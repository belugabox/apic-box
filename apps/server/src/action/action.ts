import { db, galleryManager } from '@server/core';

import { Action } from './action.types';

export class ActionManager {
    constructor() {}

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
        return await db.run('SELECT id FROM actions LIMIT 1').then(() => {
            return;
        });
    };

    all = async (): Promise<Action[]> => {
        const actions = await db.all<Action>(
            'SELECT id, title, description, type, status, createdAt, updatedAt FROM actions',
        );

        for (const action of actions) {
            if (action.type === 'gallery') {
                action.gallery = await galleryManager.get(`${action.id}`);
            }
        }

        return actions;
    };

    get = async (id: number): Promise<Action> => {
        const action = await db.get<Action>(
            'SELECT id, title, description, type, status, createdAt, updatedAt FROM actions WHERE id = ?',
            [id],
        );

        if (action.type === 'gallery') {
            action.gallery = await galleryManager.get(`${action.id}`);
        }

        return action;
    };

    add = async (action: Action): Promise<Action> => {
        const result = await db.run(
            'INSERT INTO actions (title, description, type, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [
                action.title,
                action.description,
                action.type,
                action.status,
                new Date().toISOString(),
                new Date().toISOString(),
            ],
        );

        if (action.type === 'gallery') {
            await galleryManager.add(`${result.lastID}`);
        }

        return { ...action, id: result.lastID ?? 0 };
    };

    update = async (action: Action): Promise<Action> => {
        await db.run(
            'UPDATE actions SET title = ?, description = ?, type = ?, status = ?, updatedAt = ? WHERE id = ?',
            [
                action.title,
                action.description,
                action.type,
                action.status,
                new Date().toISOString(),
                action.id,
            ],
        );

        if (action.type === 'gallery') {
            await galleryManager.add(`${action.id}`);
        }

        return { ...action };
    };

    delete = async (id: number): Promise<void> => {
        const action = await this.get(id);

        await db.run('DELETE FROM actions WHERE id = ?', [action.id]);

        if (action.type === 'gallery') {
            await galleryManager.delete(`${action.id}`);
        }
    };
}
