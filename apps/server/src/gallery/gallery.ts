import bcrypt from 'bcryptjs';
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';

import { db } from '@server/core';
import { logger } from '@server/tools/logger';

import { Album, Gallery, GalleryRow, Image } from './gallery.types';

export const GALLERY_JWT_SECRET =
    process.env.GALLERY_JWT_SECRET || 'apic-box-gallery-secret-key';

const GALLERY_DIR = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'gallery',
);
const THUMBNAIL_DIR = path.resolve(GALLERY_DIR, 'thumbnails');

const IMAGE_THUMBNAIL_SIZE = 400;

const IMAGE_NAME_PATTERN = new RegExp(`^(\\d+)\\.jpg$`, 'i');

export class GalleryManager {
    galleries: Gallery[] = [];

    constructor() {}

    async init() {
        await mkdir(GALLERY_DIR, {
            recursive: true,
        });
        await mkdir(THUMBNAIL_DIR, {
            recursive: true,
        });

        // Créer la table pour les galeries (combinée avec les mots de passe)
        await db.run(
            `CREATE TABLE IF NOT EXISTS galleries (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                password TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            );`,
        );

        // Charger UNIQUEMENT les galeries présentes en base de données
        this.galleries = [];
        const dbGalleries = await db.all<GalleryRow>(
            'SELECT * FROM galleries ORDER BY name',
        );

        for (const galleryRow of dbGalleries) {
            const galleryPath = path.join(GALLERY_DIR, galleryRow.id);

            try {
                const stats = await stat(galleryPath);
                if (stats.isDirectory()) {
                    // Charger les albums et images pour cette galerie
                    const albumList: Album[] = [];
                    const albums = await readdir(galleryPath);

                    for (const album of albums) {
                        const albumPath = path.join(galleryPath, album);
                        const albumStats = await stat(albumPath);

                        if (albumStats.isDirectory()) {
                            const imageList: Image[] = [];
                            const images = await readdir(albumPath);

                            for (const image of images) {
                                const imagePath = path.join(albumPath, image);
                                const imageStats = await stat(imagePath);

                                if (imageStats.isFile()) {
                                    const isJpg = image
                                        .toLowerCase()
                                        .endsWith('.jpg');
                                    if (isJpg) {
                                        const name = path.parse(image).name;
                                        const ratio =
                                            await this.getImageRatio(imagePath);

                                        imageList.push({
                                            name,
                                            ratio,
                                        });
                                    }
                                }
                            }

                            albumList.push({
                                name: album,
                                images: imageList,
                            });
                        }
                    }

                    this.galleries.push({
                        name: galleryRow.id,
                        albums: albumList,
                    });

                    logger.info(
                        `Gallery ${galleryRow.id} loaded from database`,
                    );
                } else {
                    logger.warn(
                        `Gallery ${galleryRow.id} exists in DB but is not a directory`,
                    );
                }
            } catch (error) {
                logger.error(
                    error,
                    `Failed to load gallery ${galleryRow.id} from filesystem`,
                );
            }
        }

        // Générer les vignettes pour les images existantes
        this.generateThumbnails(true);
    }

    async add(galleryName: string) {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        await mkdir(galleryDirPath, { recursive: true });

        // Insérer dans la base de données
        const now = new Date().toISOString();
        const exists = await db.get<GalleryRow>(
            'SELECT * FROM galleries WHERE id = ?',
            [galleryName],
        );

        if (!exists) {
            await db.run(
                'INSERT INTO galleries (id, name, password, createdAt, updatedAt) VALUES (?, ?, NULL, ?, ?)',
                [galleryName, galleryName, now, now],
            );
            logger.info(`Gallery ${galleryName} created in database`);
        }

        // Relancer init pour recharger la structure
        await this.init();
    }

    async delete(galleryName: string) {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        await rm(galleryDirPath, { recursive: true });

        // Supprimer de la base de données
        await db.run('DELETE FROM galleries WHERE id = ?', [galleryName]);
        logger.info(`Gallery ${galleryName} deleted from database`);

        // Relancer init pour recharger la structure
        await this.init();
    }

    async nextImageIndex(galleryDirPath: string) {
        // Trouver le prochain numéro séquentiel basé sur les fichiers existants dans la galerie
        const existingFiles = await readdir(galleryDirPath).catch(() => []);
        let maxIndex = 0;

        // Scanner tous les albums de la galerie pour trouver le plus grand index
        for (const galleryItem of existingFiles) {
            const itemPath = path.join(galleryDirPath, galleryItem);
            const itemStats = await stat(itemPath).catch(() => null);
            if (itemStats?.isDirectory()) {
                const itemFiles = await readdir(itemPath).catch(() => []);
                for (const itemFile of itemFiles) {
                    const match = itemFile.match(IMAGE_NAME_PATTERN);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        if (index > maxIndex) maxIndex = index;
                    }
                }
            }
        }
        let currentIndex = maxIndex + 1;
        return currentIndex;
    }

    async generateThumbnails(force: boolean = false) {
        if (force) {
            // Clear existing thumbnails
            await readdir(THUMBNAIL_DIR).then(async (thumbnails) => {
                for (const thumbnail of thumbnails) {
                    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnail);
                    await rm(thumbnailPath, { recursive: true });
                }
            });
        }
        for (const gallery of this.galleries) {
            for (const album of gallery.albums) {
                const albumPath = path.join(
                    GALLERY_DIR,
                    gallery.name,
                    album.name,
                );
                const thumbnailDirPath = path.join(
                    THUMBNAIL_DIR,
                    gallery.name,
                    album.name,
                );
                await mkdir(thumbnailDirPath, { recursive: true });

                for (const image of album.images) {
                    const imagePath = path.join(albumPath, `${image.name}.jpg`);
                    const thumbnailPath = path.join(
                        thumbnailDirPath,
                        `${image.name}.jpg`,
                    );
                    await this.generateThumbnail(imagePath, thumbnailPath);
                }
            }
        }
    }

    async health() {
        return readdir(GALLERY_DIR).then(() => {
            return;
        });
    }

    async get(name: string): Promise<Gallery | undefined> {
        // Vérifier que la galerie existe en BD
        const galleryRow = await db.get<GalleryRow>(
            'SELECT * FROM galleries WHERE id = ?',
            [name],
        );

        if (!galleryRow) {
            logger.warn(`Gallery ${name} not found in database`);
            return undefined;
        }

        // Retourner la galerie depuis la liste en mémoire
        const gallery = this.galleries.find((g) => g.name === name);
        return gallery;
    }

    /**
     * Récupérer les métadonnées d'une galerie depuis la BD
     */
    async getGalleryMetadata(galleryId: string): Promise<GalleryRow | null> {
        const gallery = await db.get<GalleryRow>(
            'SELECT * FROM galleries WHERE id = ?',
            [galleryId],
        );
        return gallery || null;
    }

    /**
     * Récupérer toutes les galeries depuis la BD
     */
    async getAllGalleries(): Promise<GalleryRow[]> {
        const galleries = await db.all<GalleryRow>('SELECT * FROM galleries');
        return galleries;
    }

    /**
     * Mettre à jour les métadonnées d'une galerie
     */
    async updateGalleryMetadata(
        galleryId: string,
        data: Partial<Omit<GalleryRow, 'id' | 'createdAt'>>,
    ): Promise<void> {
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: unknown[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }

        if (data.password !== undefined) {
            updates.push('password = ?');
            values.push(data.password);
        }

        updates.push('updatedAt = ?');
        values.push(now);
        values.push(galleryId);

        if (updates.length > 0) {
            const sql = `UPDATE galleries SET ${updates.join(', ')} WHERE id = ?`;
            await db.run(sql, values);
            logger.info(`Gallery ${galleryId} metadata updated`);

            // Relancer init pour recharger la structure si le nom a changé
            if (data.name !== undefined) {
                await this.init();
            }
        }
    }

    async getImage(
        galleryName: string,
        filename: string,
        raw: boolean = false,
    ): Promise<Buffer | null> {
        const gallery = this.galleries.find((g) => g.name === galleryName);
        if (!gallery) return null;

        for (const album of gallery.albums) {
            if (album.images.some((img) => img.name === filename)) {
                // Ajouter l'extension .jpg pour construire le chemin du fichier
                const imageFilename = `${filename}.jpg`;
                const imagePath = path.join(
                    raw ? GALLERY_DIR : THUMBNAIL_DIR,
                    galleryName,
                    album.name,
                    imageFilename,
                );

                // Vérification de sécurité
                if (!imagePath.startsWith(GALLERY_DIR)) {
                    return null;
                }

                try {
                    return await readFile(imagePath);
                } catch (error) {
                    return null;
                }
            }
        }
        return null;
    }

    async addImages(
        galleryName: string,
        albumName: string,
        files: File[],
    ): Promise<void> {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        const albumDirPath = path.join(galleryDirPath, albumName);
        const thumbnailDirPath = path.join(
            THUMBNAIL_DIR,
            galleryName,
            albumName,
        );

        // Ensure the album directory exists
        await mkdir(albumDirPath, { recursive: true });
        await mkdir(thumbnailDirPath, { recursive: true });

        let currentIndex = await this.nextImageIndex(galleryDirPath);

        // Copy each image to the album directory
        for (const file of files) {
            // Générer le nouveau nom de fichier avec 4 chiffres (ex: 0001.jpg, 0256.jpg)
            const filename = `${String(currentIndex).padStart(4, '0')}.jpg`;
            currentIndex++;

            // Convertir File en Buffer
            const buffer = await file.arrayBuffer();

            // Copy the image file to the album directory
            const imagePath = path.join(albumDirPath, filename);
            await this.saveImageBuffer(buffer, imagePath);

            // Generate thumbnail
            const thumbnailPath = path.join(thumbnailDirPath, filename);
            await this.generateThumbnail(imagePath, thumbnailPath);
        }

        // Relancer init pour recharger la structure
        await this.init();
    }

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

    private async getImageRatio(imagePath: string): Promise<number> {
        const metadata = await sharp(imagePath).metadata();
        if (metadata.width && metadata.height) {
            return Math.round((metadata.width / metadata.height) * 100) / 100;
        }
        return 1;
    }

    private async saveImageBuffer(
        buffer: ArrayBuffer,
        imagePath: string,
    ): Promise<void> {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(imagePath, Buffer.from(buffer));
    }

    // ===== Méthodes d'authentification =====

    /**
     * Définir un mot de passe pour une galerie
     */
    async setPassword(galleryId: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();

        const existingGallery = await db.get<GalleryRow>(
            'SELECT * FROM galleries WHERE id = ?',
            [galleryId],
        );

        if (existingGallery) {
            await db.run(
                'UPDATE galleries SET password = ?, updatedAt = ? WHERE id = ?',
                [hashedPassword, now, galleryId],
            );
        } else {
            // Créer une nouvelle entrée de galerie avec mot de passe
            await db.run(
                'INSERT INTO galleries (id, name, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
                [galleryId, galleryId, hashedPassword, now, now],
            );
        }

        logger.info(`Gallery ${galleryId} password protected`);
    }

    /**
     * Retirer la protection d'une galerie
     */
    async removePassword(galleryId: string): Promise<void> {
        await db.run('UPDATE galleries SET password = NULL WHERE id = ?', [
            galleryId,
        ]);
        logger.info(`Gallery ${galleryId} protection removed`);
    }

    /**
     * Vérifier si une galerie est protégée
     */
    async isProtected(galleryId: string): Promise<boolean> {
        const result = await db.get<GalleryRow>(
            'SELECT password FROM galleries WHERE id = ?',
            [galleryId],
        );
        return result ? result.password !== null : false;
    }

    /**
     * Vérifier le mot de passe et retourner un token JWT
     */
    async login(galleryId: string, password: string): Promise<string | null> {
        const gallery = await db.get<GalleryRow>(
            'SELECT * FROM galleries WHERE id = ?',
            [galleryId],
        );

        if (!gallery || !gallery.password) {
            return null; // Galerie non protégée
        }

        const passwordMatch = await bcrypt.compare(password, gallery.password);

        if (!passwordMatch) {
            return null; // Mot de passe incorrect
        }

        // Générer un token JWT
        const token = await sign({ galleryId }, GALLERY_JWT_SECRET);
        logger.info(`Gallery ${galleryId} unlocked`);
        return token;
    }

    /**
     * Vérifier un token JWT
     */
    async verifyToken(token: string): Promise<{ galleryId: string } | null> {
        try {
            const payload = await verify(token, GALLERY_JWT_SECRET);
            return payload as { galleryId: string };
        } catch (err) {
            logger.error(err, 'Gallery token verification failed');
            return null;
        }
    }

    /**
     * Middleware pour vérifier l'accès à une galerie protégée
     */
    checkAccess = () => async (c: Context, next: () => Promise<void>) => {
        const galleryId = c.req.param('galleryName');
        const token = c.req.header('X-Gallery-Token');

        // Vérifier si la galerie est protégée
        const isProtected = await this.isProtected(galleryId);

        if (!isProtected) {
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
}
