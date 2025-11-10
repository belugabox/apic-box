export enum ActionStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
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
