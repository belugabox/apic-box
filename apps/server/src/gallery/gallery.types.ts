export type Gallery = {
    name: string;
    albums: Album[];
};

export type Album = {
    name: string;
    images: Image[];
};

export type Image = {
    name: string;
    ratio: number;
};

export type GalleryRow = {
    id: string;
    name: string;
    password: string | null;
    createdAt: string;
    updatedAt: string;
};
