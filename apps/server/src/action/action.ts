import { db, galleryManager } from '@server/core';
import { MappedRepository } from '@server/db';

import { Action, ActionType } from './action.types';

type ActionRow = Omit<Action, 'createdAt' | 'updatedAt' | 'gallery'> & {
    createdAt: string;
    updatedAt: string;
};

export class ActionManager extends MappedRepository<ActionRow, Action> {
    constructor() {
        super(db, 'actions');
    }

    protected async mapToDomain(row: ActionRow): Promise<Action> {
        // Si l'action est de type gallery
        if (row.type === ActionType.GALLERY) {
            let gallery = undefined;

            // Charger la galerie si galleryId existe
            if ((row as any).galleryId) {
                gallery = await galleryManager.get((row as any).galleryId);
            }

            return {
                ...row,
                type: ActionType.GALLERY,
                galleryId: (row as any).galleryId || null,
                gallery,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
            } satisfies Action;
        }

        // Sinon, c'est une action simple
        return {
            ...row,
            type: ActionType.SIMPLE,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        } satisfies Action;
    }

    init = async () => {
        await db.run(
            `CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY, 
                title TEXT NOT NULL, 
                description TEXT,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                galleryId TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (galleryId) REFERENCES galleries(id) ON DELETE SET NULL
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
        // Valider : galleryId ne doit être fourni que pour les actions GALLERY
        let galleryId: string | undefined;

        if (action.type === ActionType.GALLERY) {
            galleryId = action.galleryId;

            // Si pas de galleryId, en générer un basé sur le titre de l'action
            if (!galleryId) {
                // Générer un ID unique pour la galerie
                galleryId = `gallery-${action.title
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w-]/g, '')}-${Date.now()}`;
            }

            // Créer la galerie associée
            await galleryManager.add(galleryId);
        } else if ((action as any).galleryId !== undefined) {
            throw new Error(
                'galleryId can only be set for actions with type=GALLERY',
            );
        }

        const result = await this.repo.create({
            title: action.title,
            description: action.description,
            type: action.type,
            status: action.status,
            galleryId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const created = await this.findById(result.lastID);
        return created!;
    };

    updateAction = async (
        action: Omit<Action, 'createdAt' | 'updatedAt'>,
    ): Promise<Action> => {
        // Récupérer l'action existante
        const existing = await this.findById(action.id);
        if (!existing) {
            throw new Error(`Action ${action.id} not found`);
        }

        // Valider : galleryId ne doit être fourni que pour les actions GALLERY
        let galleryId: string | undefined;

        if (action.type === ActionType.GALLERY) {
            galleryId = action.galleryId;

            // Si c'est une conversion SIMPLE → GALLERY, créer une nouvelle galerie
            if (existing.type === ActionType.SIMPLE) {
                if (!galleryId) {
                    galleryId = `gallery-${action.title
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]/g, '')}-${Date.now()}`;
                }
                await galleryManager.add(galleryId);
            }
        } else if ((action as any).galleryId !== undefined) {
            throw new Error(
                'galleryId can only be set for actions with type=GALLERY',
            );
        }

        await this.repo.update(action.id, {
            title: action.title,
            description: action.description,
            type: action.type,
            status: action.status,
            galleryId,
            updatedAt: new Date().toISOString(),
        });

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
