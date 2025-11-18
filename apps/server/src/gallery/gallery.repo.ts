import { db } from '@server/db';
import { MappedRepository, RunResult } from '@server/db';

import { Album, Gallery, Image } from './gallery.types';

type GalleryRow = Omit<
    Gallery,
    'isProtected' | 'createdAt' | 'updatedAt' | 'albums'
> & {
    password?: string;
    createdAt: string;
    updatedAt: string;
};

type AlbumRow = Omit<Album, 'createdAt' | 'updatedAt' | 'images'> & {
    galleryId: number;
    createdAt: string;
    updatedAt: string;
};

type ImageRow = Omit<Image, 'createdAt' | 'updatedAt' | 'fullcode'> & {
    albumId: number;
    createdAt: string;
    updatedAt: string;
};

export class GalleryRepository extends MappedRepository<GalleryRow, Gallery> {
    private albumRepository: AlbumRepository;
    private imageRepository: ImageRepository;
    constructor() {
        super(db, 'gallery');
        this.imageRepository = new ImageRepository();
        this.albumRepository = new AlbumRepository(this.imageRepository);
    }

    protected async initializeSchema(): Promise<void> {}

    protected async mapToDomain(row: GalleryRow): Promise<Gallery> {
        const albums = await this.albumRepository.findMany({
            galleryId: row.id,
        });
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            albums,
            isProtected: !!row.password,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        } satisfies Gallery;
    }

    getHashedPassword = async (
        galleryId: number,
    ): Promise<string | undefined> => {
        const row = await this.repo.findById(galleryId);
        if (!row) return undefined;
        return row.password;
    };

    getAlbum = async (albumId: number): Promise<Album | undefined> => {
        return this.albumRepository.findById(albumId);
    };

    addAlbum = async (
        galleryId: number,
        name: string,
        code: string,
    ): Promise<RunResult> => {
        return this.albumRepository.create({
            galleryId,
            name,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    };

    updateAlbum = async (
        albumId: number,
        name: string,
        code: string,
    ): Promise<RunResult> => {
        return this.albumRepository.update(albumId, {
            name,
            code,
            updatedAt: new Date().toISOString(),
        });
    };

    deleteAlbum = async (albumId: number): Promise<RunResult> => {
        return this.albumRepository.delete(albumId);
    };

    getImage = async (imageId: number): Promise<Image | undefined> => {
        return this.imageRepository.findById(imageId);
    };

    addImage = async (
        albumId: number,
        filename: string,
        code: string,
        ratio: number,
    ): Promise<RunResult> => {
        return this.albumRepository.addImage(albumId, filename, code, ratio);
    };

    deleteImage = async (imageId: number): Promise<RunResult> => {
        return this.albumRepository.deleteImage(imageId);
    };
}

export class AlbumRepository extends MappedRepository<AlbumRow, Album> {
    private imageRepository: ImageRepository;
    constructor(imageRepository: ImageRepository) {
        super(db, 'gallery_album');
        this.imageRepository = imageRepository;
    }
    protected async initializeSchema(): Promise<void> {}
    protected async mapToDomain(row: AlbumRow): Promise<Album> {
        const images = await this.imageRepository.findByAlbum(row);
        return {
            ...row,
            images,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        } satisfies Album;
    }

    async findByGalleryId(galleryId: number): Promise<Album[]> {
        const rows = await this.repo.findMany({ galleryId });
        return Promise.all(rows.map((row) => this.mapToDomain(row)));
    }

    async findByAlbumId(albumId: number): Promise<Album | undefined> {
        const row = await this.repo.findById(albumId);
        if (!row) return undefined;
        return this.mapToDomain(row);
    }

    async addImage(
        albumId: number,
        filename: string,
        code: string,
        ratio: number,
    ): Promise<RunResult> {
        return this.imageRepository.create({
            albumId,
            filename,
            code,
            ratio,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    async deleteImage(imageId: number): Promise<RunResult> {
        return this.imageRepository.delete(imageId);
    }
}

export class ImageRepository extends MappedRepository<ImageRow, Image> {
    constructor() {
        super(db, 'gallery_album_image');
    }
    protected async initializeSchema(): Promise<void> {}
    protected async mapToDomain(
        row: ImageRow,
        album?: AlbumRow,
    ): Promise<Image> {
        return {
            ...row,
            fullcode: `${album?.code ?? '???'}${row.code}`,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        } satisfies Image;
    }
    async findByAlbum(album: AlbumRow): Promise<Image[]> {
        const rows = await this.repo.findMany({ albumId: album.id });
        return Promise.all(rows.map((row) => this.mapToDomain(row, album)));
    }
}
