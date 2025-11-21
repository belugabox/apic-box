import { EntityStatus } from '../modules/shared.types';

export type GalleryLight = Omit<Gallery, 'albums'>;

export type Gallery = {
    id: number;
    name: string;
    description: string;
    status: EntityStatus;
    albums: Album[];
    createdAt: Date;
    updatedAt: Date;
    isProtected: boolean;
};

export type Album = {
    id: number;
    code: string;
    name: string;
    images: Image[];
    createdAt: Date;
    updatedAt: Date;

    galleryId: number;
    orderIndex: number;
};

export type Image = {
    id: number;
    code: string;
    filename: string;
    ratio: number;
    createdAt: Date;
    updatedAt: Date;

    albumId: number;

    fullcode: string;
};
