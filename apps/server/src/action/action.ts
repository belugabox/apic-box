import { galleryManager } from '@server/core';

import { ActionRepository } from './action.repo';
import { Action, ActionType } from './action.types';

export class ActionManager {
    private repo!: ActionRepository;

    constructor() {}

    init = async () => {
        this.repo = new ActionRepository();
    };

    health = async () => {
        return await this.repo.findOne({});
    };

    all = async (): Promise<Action[]> => {
        return this.repo.findAll();
    };

    get = async (id: number): Promise<Action | undefined> => {
        return this.repo.findById(id);
    };

    add = async (
        action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<Action> => {
        let galleryId: number | undefined;
        if (action.type === ActionType.GALLERY) {
            galleryId = await galleryManager.add(action.name);
        }

        const result = await this.repo.create({
            name: action.name,
            description: action.description,
            status: action.status,
            galleryId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const created = await this.repo.findById(result.lastID);
        return created!;
    };

    updateAction = async (
        action: Omit<Action, 'createdAt' | 'updatedAt'>,
    ): Promise<Action> => {
        // Récupérer l'action existante
        const existing = await this.repo.findById(action.id);
        if (!existing) {
            throw new Error(`Action ${action.id} not found`);
        }

        // Si c'est une conversion OTHER → GALLERY, créer une nouvelle galerie
        let galleryId: number | undefined;
        if (
            existing.type !== action.type &&
            action.type === ActionType.GALLERY
        ) {
            galleryId = await galleryManager.add(action.name);
        }

        if (existing.type === ActionType.GALLERY) {
            galleryId = existing.galleryId;
        }

        await this.repo.update(action.id, {
            name: action.name,
            description: action.description,
            status: action.status,
            galleryId,
            updatedAt: new Date().toISOString(),
        });

        const updated = await this.repo.findById(action.id);
        return updated!;
    };

    deleteAction = async (id: number): Promise<void> => {
        const action = await this.get(id);
        if (!action) return;

        await this.repo.delete(id);

        if (action.galleryId) {
            await galleryManager.delete(action.galleryId);
        }
    };
}
