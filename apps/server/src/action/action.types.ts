import { Gallery } from '@server/gallery/gallery.types';

export enum ActionStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ActionType {
    SIMPLE = 'simple',
    GALLERY = 'gallery',
}

export type BaseAction = {
    id: number;
    title: string;
    description: string;
    status: ActionStatus;
    createdAt: Date;
    updatedAt: Date;
};

export type SimpleAction = BaseAction & {
    type: ActionType.SIMPLE;
    galleryId?: never;
    gallery?: never;
};

export type GalleryAction = BaseAction & {
    type: ActionType.GALLERY;
    galleryId: string | null;
    gallery?: Gallery;
};

export type Action = SimpleAction | GalleryAction;
