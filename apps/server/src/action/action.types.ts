export enum ActionStatus {
    DRAFT = 'draft',
    TESTING = 'testing',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

export enum ActionType {
    SIMPLE = 'simple',
    GALLERY = 'gallery',
}

export type Action = {
    id: number;
    name: string;
    description: string;
    status: ActionStatus;
    type: ActionType;
    createdAt: Date;
    updatedAt: Date;
    galleryId?: number;
};
