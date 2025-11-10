import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';

import { logger } from '@server/tools/logger';

import { GalleryRepository } from './gallery.repo';
import { Album, Gallery } from './gallery.types';

export const GALLERY_JWT_SECRET =
    process.env.GALLERY_JWT_SECRET || 'apic-box-gallery-secret-key';

const GALLERY_DIR = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'gallery',
);
const THUMBNAIL_DIR = 'thumbnails';

const IMAGE_THUMBNAIL_SIZE = 400;

export class GalleryManager {
    private repo!: GalleryRepository;

    constructor() {}

    async init() {
        this.repo = new GalleryRepository();

        // Ensure gallery directory exists
        await mkdir(GALLERY_DIR, { recursive: true });
    }

    health = async () => {
        return Promise.all([readdir(GALLERY_DIR), this.repo.findOne({})]);
    };

    all = async (): Promise<Gallery[]> => {
        return this.repo.findAll();
    };

    get = async (id: number): Promise<Gallery | undefined> => {
        return this.repo.findById(id);
    };

    add = async (name: string): Promise<number> => {
        const result = await this.repo.create({
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const created = await this.repo.findById(result.lastID);
        return created!.id;
    };

    update = async (
        gallery: Omit<Gallery, 'albums' | 'createdAt' | 'updatedAt'>,
    ): Promise<void> => {
        await this.repo.update(gallery.id, gallery);
    };

    delete = async (id: number): Promise<void> => {
        await rm(path.join(GALLERY_DIR, id.toString()), { recursive: true });
        await this.repo.delete(id);
    };

    setPassword = async (
        galleryId: string,
        password: string,
    ): Promise<void> => {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.repo.update(galleryId, { password: hashedPassword });
    };

    removePassword = async (galleryId: string): Promise<void> => {
        await this.repo.update(galleryId, { password: undefined });
    };

    /**
     * Middleware pour vérifier l'accès à une galerie protégée
     */
    checkAccess = () => async (c: Context, next: () => Promise<void>) => {
        const galleryId = Number(c.req.param('galleryId'));
        const token = c.req.header('X-Gallery-Token');

        const hashedPassword = await this.repo.getHashedPassword(galleryId);

        if (!hashedPassword) {
            // Galerie non protégée, accès libre
            return await next();
        }

        // Galerie protégée, vérifier le token
        if (!token) {
            throw new Error('No token provided');
        }

        const payload = await this.verifyToken(token);
        if (!payload || payload.galleryId !== galleryId) {
            throw new Error('Invalid or expired token');
        }

        // Token valide, continuer
        return await next();
    };

    async login(galleryId: number, password: string): Promise<string | null> {
        const hashedPassword = await this.repo.getHashedPassword(galleryId);
        if (!hashedPassword) {
            return null; // Galerie non protégée
        }

        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return null; // Mot de passe incorrect
        }

        // Générer un token JWT
        const token = await sign({ galleryId }, GALLERY_JWT_SECRET);
        logger.info(`Gallery ${galleryId} unlocked`);
        return token;
    }

    async verifyToken(token: string): Promise<{ galleryId: number } | null> {
        try {
            const payload = await verify(token, GALLERY_JWT_SECRET);
            return payload as { galleryId: number };
        } catch (err) {
            logger.error(err, 'Gallery token verification failed');
            return null;
        }
    }

    // ALBUM
    private getAlbumPath = async (albumId: number): Promise<string> => {
        const album = await this.repo.getAlbum(albumId);
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        return path.join(
            GALLERY_DIR,
            album.galleryId.toString(),
            album.id.toString(),
        );
    };

    getAlbum = async (albumId: number): Promise<Album | undefined> => {
        return await this.repo.getAlbum(albumId);
    };

    addAlbum = async (galleryId: number, name: string): Promise<void> => {
        const result = await this.repo.addAlbum(galleryId, name);
        const albumId = result.lastID;
        if (!albumId) {
            throw new Error('Failed to create album');
        }

        // Créer le répertoire de l'album
        const albumPath = await this.getAlbumPath(albumId);
        await mkdir(albumPath, { recursive: true });
    };

    deleteAlbum = async (albumId: number): Promise<void> => {
        // remove album directory
        const albumPath = await this.getAlbumPath(albumId);
        await rm(albumPath, { recursive: true });

        await this.repo.deleteAlbum(albumId);
    };

    // IMAGE
    private getImagePath = async (
        imageId: number,
        thumbnail: boolean = false,
    ): Promise<string> => {
        const image = await this.repo.getImage(imageId);
        if (!image) {
            throw new Error(`Image ${imageId} not found`);
        }
        if (!image.albumId) {
            throw new Error(`Album for image ${imageId} not found`);
        }
        const album = await this.repo.getAlbum(image.albumId);
        if (!album) {
            throw new Error(`Gallery for album ${image.albumId} not found`);
        }
        const dir = path.join(
            GALLERY_DIR,
            album.galleryId.toString(),
            album.id.toString(),
            thumbnail ? THUMBNAIL_DIR : '',
        );
        await mkdir(dir, { recursive: true });

        return path.join(dir, `${image.filename}`);
    };

    getImageBuffer = async (
        imageId: number,
        thumbnail: boolean = false,
    ): Promise<Buffer | null> => {
        const imagePath = await this.getImagePath(imageId, thumbnail);

        return await readFile(imagePath);
    };

    addImage = async (albumId: number, file: File): Promise<void> => {
        const ratio = await sharp(await file.arrayBuffer())
            .metadata()
            .then((metadata) => {
                if (metadata.width && metadata.height) {
                    return (
                        Math.round((metadata.width / metadata.height) * 100) /
                        100
                    );
                }
                return 1;
            });

        // find next image name
        const albumPath = await this.getAlbumPath(albumId);
        const existingFiles = await readdir(albumPath).catch(() => []);
        let maxIndex = 0;
        for (const galleryItem of existingFiles) {
            // Skip thumbnails directory
            if (galleryItem === THUMBNAIL_DIR) {
                continue;
            }
            const match = galleryItem.match(/^(\d+)\.jpg$/i);
            if (match) {
                const index = parseInt(match[1], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        }
        const currentIndex = maxIndex + 1;
        const filename = `${String(currentIndex).padStart(3, '0')}.jpg`;
        const code = `${String(albumId).padStart(2, '0')}${String(currentIndex).padStart(3, '0')}`;

        // add image to database
        const result = await this.repo.addImage(albumId, filename, code, ratio);
        const imageId = result.lastID;
        if (!imageId) {
            throw new Error('Failed to create image');
        }

        // save image file
        const imagePath = await this.getImagePath(imageId);
        await this.saveImageBuffer(await file.arrayBuffer(), imagePath);

        // generate thumbnail
        const thumbnailPath = await this.getImagePath(imageId, true);
        await this.generateThumbnail(imagePath, thumbnailPath);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // to avoid overload when adding many images at once
    };

    addImages = async (albumId: number, files: File[]): Promise<void> => {
        for (const file of files) {
            await this.addImage(albumId, file);
        }
    };

    deleteImage = async (imageId: number): Promise<void> => {
        // remove image file
        const imagePath = await this.getImagePath(imageId);
        await rm(imagePath, { recursive: true });

        await this.repo.deleteImage(imageId);
    };

    private async generateThumbnail(
        imagePath: string,
        thumbnailPath: string,
    ): Promise<void> {
        await sharp(imagePath)
            .resize(IMAGE_THUMBNAIL_SIZE, IMAGE_THUMBNAIL_SIZE, {
                fit: 'inside',
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
    }

    private async saveImageBuffer(
        buffer: ArrayBuffer,
        imagePath: string,
    ): Promise<void> {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(imagePath, Buffer.from(buffer));
    }
}
