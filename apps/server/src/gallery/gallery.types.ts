export type Gallery = {
    id: number;
    name: string;
    albums: Album[];
    createdAt: Date;
    updatedAt: Date;
    isProtected: boolean;
};

export type Album = {
    id: number;
    name: string;
    images: Image[];
    createdAt: Date;
    updatedAt: Date;
    galleryId: number;
};

export type Image = {
    id: number;
    filename: string;
    code: string;
    ratio: number;
    createdAt: Date;
    updatedAt: Date;
    albumId: number;
};
