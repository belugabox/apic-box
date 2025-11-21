export enum EntityStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

export type User = {
    id: number;
    username: string;
    role: 'admin' | 'user';
    createdAt: Date;
    updatedAt: Date;
};
