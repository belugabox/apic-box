import { GalleryStatus } from '@server/gallery/gallery.types';

export type Blog = {
    id: number;
    title: string;
    content: string;
    author: string;
    status: GalleryStatus;
    createdAt: Date;
    updatedAt: Date;
};
