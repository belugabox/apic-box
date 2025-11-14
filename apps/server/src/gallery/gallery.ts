import archiver from 'archiver';
import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';

import { AuthRole } from '@server/auth';
import { authManager } from '@server/core';
import { UnauthorizedError } from '@server/tools/errorHandler';
import { generateExcel } from '@server/tools/excel';
import { logger } from '@server/tools/logger';

import { GalleryRepository } from './gallery.repo';
import { Album, Gallery } from './gallery.types';

export let GALLERY_JWT_SECRET: string;

if (!process.env.GALLERY_JWT_SECRET) {
    throw new Error('GALLERY_JWT_SECRET environment variable is required');
}

GALLERY_JWT_SECRET = process.env.GALLERY_JWT_SECRET;

const GALLERY_DIR = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'gallery',
);
const THUMBNAIL_DIR = 'thumbnails';

const IMAGE_THUMBNAIL_SIZE = 500;

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

    // ---
    private getGalleryPath = async (galleryId: number): Promise<string> => {
        const galleryPath = path.join(GALLERY_DIR, galleryId.toString());
        return galleryPath;
    };

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

    // GALLERY
    all = async (isAdmin: boolean): Promise<Gallery[]> => {
        return (await this.repo.findAll())
            .filter((gallery) => {
                return isAdmin || gallery.status === 'published';
            })
            .map((gallery) => ({
                id: gallery.id,
                name: gallery.name,
                description: gallery.description,
                status: gallery.status,
                createdAt: gallery.createdAt,
                updatedAt: gallery.updatedAt,
                isProtected: gallery.isProtected,
                albums: [],
            }));
    };

    get = async (
        id: number,
        isAdmin: boolean,
    ): Promise<Gallery | undefined> => {
        const gallery = await this.repo.findById(id);
        if (!gallery || !(isAdmin || gallery.status === 'published')) {
            return undefined;
        }
        return gallery;
    };

    add = async (
        gallery: Omit<
            Gallery,
            'id' | 'createdAt' | 'updatedAt' | 'albums' | 'isProtected'
        >,
    ): Promise<number> => {
        logger.info(`Creating gallery: ${gallery.name}`);
        const result = await this.repo.create({
            ...gallery,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const galleryId = result.lastID!;
        logger.info(`Gallery created with ID: ${galleryId}`);
        const galleryPath = await this.getGalleryPath(galleryId);
        await mkdir(galleryPath, { recursive: true });

        return galleryId;
    };

    update = async (
        gallery: Omit<
            Gallery,
            'createdAt' | 'updatedAt' | 'albums' | 'isProtected'
        >,
    ): Promise<Gallery> => {
        const existing = await this.repo.findById(gallery.id);
        if (!existing) {
            throw new Error(`Gallery ${gallery.id} not found`);
        }

        await this.repo.update(gallery.id, {
            name: gallery.name,
            description: gallery.description,
            status: gallery.status,
            updatedAt: new Date().toISOString(),
        });

        const updated = await this.get(gallery.id, true);
        if (!updated) {
            throw new Error(`Gallery ${gallery.id} not found`);
        }
        logger.info(`Gallery updated with ID: ${updated.id}`);
        return updated;
    };

    delete = async (id: number): Promise<void> => {
        logger.info(`Deleting gallery: ${id}`);
        try {
            await rm(path.join(GALLERY_DIR, id.toString()), {
                recursive: true,
            });
        } catch {
            logger.warn(`Gallery directory for gallery ${id} not found`);
        }
        await this.repo.delete(id);
        logger.info(`Gallery deleted: ${id}`);
    };

    setPassword = async (
        galleryId: number,
        password: string,
    ): Promise<void> => {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.repo.update(galleryId, { password: hashedPassword });
    };

    removePassword = async (galleryId: number): Promise<void> => {
        await this.repo.update(galleryId, { password: undefined });
    };

    setCover = async (galleryId: number, file: File): Promise<void> => {
        const coverPath = await this.getCoverPath(galleryId);
        await this.generateThumbnail(await file.arrayBuffer(), coverPath, 600);

        await this.repo.update(galleryId, {
            updatedAt: new Date().toISOString(),
        });
    };

    removeCover = async (galleryId: number): Promise<void> => {
        try {
            const coverPath = await this.getCoverPath(galleryId);
            await rm(coverPath, { recursive: true });
        } catch {
            logger.warn(`Gallery cover for gallery ${galleryId} not found`);
        }

        await this.repo.update(galleryId, {
            updatedAt: new Date().toISOString(),
        });
    };

    getCoverBuffer = async (galleryId: number): Promise<Buffer | null> => {
        const coverPath = await this.getCoverPath(galleryId);
        if (!(await existsSync(coverPath))) {
            return null;
        }
        return await readFile(coverPath);
    };

    getCoverPath = async (galleryId: number): Promise<string> => {
        const coverPath = path.join(
            GALLERY_DIR,
            galleryId.toString(),
            'cover.jpg',
        );
        return coverPath;
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
            return await authManager.authMiddleware(AuthRole.ADMIN)(c, next);
            //throw new UnauthorizedError('No token provided');
        }

        const payload = await this.verifyToken(token);
        if (!payload || payload.galleryId !== galleryId) {
            throw new UnauthorizedError('Invalid or expired token');
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

    export = async (galleryId: number): Promise<Blob | null> => {
        const gallery = await this.get(galleryId, true);
        if (!gallery) {
            return null;
        }
        const albums = gallery.albums;
        if (!albums || albums.length === 0) {
            return null;
        }

        const data: Array<{
            Album: string;
            Code: string;
        }> = [];

        for (const album of albums) {
            for (const image of album.images) {
                data.push({
                    Album: album.name,
                    Code: image.code,
                });
            }
        }
        logger.info(
            `Exporting ${gallery.name} with ${data.length} images to Excel`,
        );

        // Générer le fichier Excel
        const excelBlob = await generateExcel(data);
        const excelBuffer = await excelBlob.arrayBuffer();

        // Créer un ZIP avec les images et l'Excel
        const archive = archiver.create('zip', { zlib: { level: 9 } });

        // Créer un buffer pour le ZIP
        const chunks: Uint8Array[] = [];
        archive.on('data', (chunk: Uint8Array) => {
            chunks.push(chunk);
        });

        // Ajouter le fichier Excel
        archive.append(Buffer.from(excelBuffer), {
            name: `codes.xlsx`,
        });

        // Ajouter les images
        for (const album of albums) {
            for (const image of album.images) {
                try {
                    const imagePath = await this.getImagePath(image.id, false);
                    const imageBuffer = await readFile(imagePath);
                    archive.append(imageBuffer, {
                        name: path.join(
                            'photos',
                            image.code + path.extname(image.filename),
                        ),
                    });
                } catch (err) {
                    logger.warn(`Failed to add image ${image.id} to archive`);
                }
            }
        }

        // Finaliser l'archive
        return new Promise((resolve, reject) => {
            archive.on('end', () => {
                const zipBuffer = Buffer.concat(chunks);
                const blob = new Blob([zipBuffer], {
                    type: 'application/zip',
                });
                resolve(blob);
            });

            archive.on('error', (err: Error) => {
                logger.error(err, 'Failed to create archive');
                reject(err);
            });

            archive.finalize();
        });
    };

    // ALBUM
    getAlbum = async (albumId: number): Promise<Album | undefined> => {
        return await this.repo.getAlbum(albumId);
    };

    addAlbum = async (
        galleryId: number,
        name: string,
        code: string,
    ): Promise<void> => {
        logger.info(`Adding album "${name}" to gallery ${galleryId}`);

        code = code.toUpperCase();
        const result = await this.repo.addAlbum(galleryId, name, code);
        const albumId = result.lastID;
        if (!albumId) {
            logger.error(
                `Failed to create album "${name}" in gallery ${galleryId}`,
            );
            throw new Error('Failed to create album');
        }

        // Créer le répertoire de l'album
        const albumPath = await this.getAlbumPath(albumId);
        await mkdir(albumPath, { recursive: true });
        logger.info(`Album created with ID: ${albumId}`);
    };

    deleteAlbum = async (albumId: number): Promise<void> => {
        logger.info(`Deleting album ${albumId}`);
        // remove album directory
        try {
            const albumPath = await this.getAlbumPath(albumId);
            await rm(albumPath, { recursive: true });
        } catch {
            logger.warn(`Album directory for album ${albumId} not found`);
        }

        await this.repo.deleteAlbum(albumId);
        logger.info(`Album deleted: ${albumId}`);
    };

    // IMAGE

    getImageBuffer = async (
        imageId: number,
        thumbnail: boolean = false,
    ): Promise<Buffer | null> => {
        const imagePath = await this.getImagePath(imageId, thumbnail);

        return await readFile(imagePath);
    };

    addImage = async (albumId: number, file: File): Promise<void> => {
        logger.info(`Adding image to album ${albumId}: ${file.name}`);

        // calculate image ratio
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
        const album = await this.repo.getAlbum(albumId);
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        const albumPath = await this.getAlbumPath(album.id);
        const existingFiles = await readdir(albumPath).catch(() => []);
        let maxIndex = 0;
        for (const galleryItem of existingFiles) {
            // Skip thumbnails directory
            if (galleryItem === THUMBNAIL_DIR) {
                continue;
            }
            const match = galleryItem.match(/^(\d+)\.[a-zA-Z0-9]+$/i);
            console.log(match);
            if (match) {
                const index = parseInt(match[1], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        }
        const currentIndex = maxIndex + 1;

        // generate code
        const shortCode = `${String(currentIndex).padStart(3, '0')}`;
        const code = `${album.code}${shortCode}`;
        const filename = `${shortCode}${path.extname(file.name)}`;

        // add image to database
        const result = await this.repo.addImage(
            album.id,
            filename,
            code,
            ratio,
        );
        const imageId = result.lastID;
        if (!imageId) {
            logger.error(`Failed to create image in album ${albumId}`);
            throw new Error('Failed to create image');
        }

        // save image file
        const imagePath = await this.getImagePath(imageId);
        await this.saveImageBuffer(await file.arrayBuffer(), imagePath);

        // generate thumbnail
        const thumbnailPath = await this.getImagePath(imageId, true);
        await this.generateThumbnail(await file.arrayBuffer(), thumbnailPath);

        logger.info(`Image added with ID: ${imageId}, code: ${code}`);
    };

    addImages = async (albumId: number, files: File[]): Promise<void> => {
        const album = await this.repo.getAlbum(albumId);
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        logger.info(`Adding ${files.length} images to album ${albumId}`);
        for (const file of files) {
            await this.addImage(album.id, file);
        }
    };

    deleteImage = async (imageId: number): Promise<void> => {
        logger.info(`Deleting image ${imageId}`);
        // remove image file
        try {
            const imagePath = await this.getImagePath(imageId);
            const thumbnailPath = await this.getImagePath(imageId, true);
            await rm(imagePath, { recursive: true });
            await rm(thumbnailPath, { recursive: true });
        } catch {
            logger.warn(`Image file for image ${imageId} not found`);
        }

        await this.repo.deleteImage(imageId);
        logger.info(`Image deleted: ${imageId}`);
    };

    private async generateThumbnail(
        buffer: ArrayBuffer,
        thumbnailPath: string,
        size?: number,
    ): Promise<void> {
        await sharp(buffer)
            .resize(
                size || IMAGE_THUMBNAIL_SIZE,
                size || IMAGE_THUMBNAIL_SIZE,
                {
                    fit: 'inside',
                },
            )
            .jpeg({ quality: 90 })
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
