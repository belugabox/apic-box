import { EntityStatus } from '@server/modules/shared.types';

export type Blog = {
    id: number;
    title: string;
    content: string;
    author: string;
    status: EntityStatus;
    createdAt: Date;
    updatedAt: Date;
};
