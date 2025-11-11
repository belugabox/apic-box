import { db } from '@server/db';
import { MappedRepository } from '@server/db';

import { Action, ActionType } from './action.types';

export type ActionRow = Omit<
    Action,
    'type' | 'createdAt' | 'updatedAt' | 'gallery'
> & {
    createdAt: string;
    updatedAt: string;
};

export class ActionRepository extends MappedRepository<ActionRow, Action> {
    constructor() {
        super(db, 'action');
    }

    protected async initializeSchema(): Promise<void> {
        db.run(
            `CREATE TABLE IF NOT EXISTS action (
                id INTEGER PRIMARY KEY, 
                name TEXT NOT NULL, 
                description TEXT,
                status TEXT NOT NULL,
                galleryId INTEGER,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (galleryId) REFERENCES gallery(id) ON DELETE SET NULL
            );`,
        );
    }

    protected async mapToDomain(row: ActionRow): Promise<Action> {
        return {
            ...row,
            type: row.galleryId ? ActionType.GALLERY : ActionType.SIMPLE,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        } satisfies Action;
    }
}
