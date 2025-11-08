import { Gallery } from '@server/gallery/gallery.types';

export interface Action {
    id: number;
    title: string;
    description: string;
    type: ActionType;
    status: ActionStatus;
    createdAt: Date;
    updatedAt: Date;

    gallery?: Gallery;
}

export enum ActionStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ActionType {
    SIMPLE = 'simple',
    GALLERY = 'gallery',
}
