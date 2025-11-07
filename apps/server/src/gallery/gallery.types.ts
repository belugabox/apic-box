export interface Gallery {
    name: string;
    albums: Album[];
}

export interface Album {
    name: string;
    images: Image[];
}

export interface Image {
    name: string;
    ratio: number;
}
