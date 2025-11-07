import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';
import unzipper from 'unzipper';

import { logger } from '@server/tools/logger';

import { Album, Gallery, Image } from './gallery.types';

const GALLERY_DIR = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'gallery',
);

export class GalleryManager {
    galleries: Gallery[] = [];

    constructor() {}

    async init() {
        await readdir(GALLERY_DIR).then(async (files) => {
            for (const file of files) {
                const stats = await stat(path.join(GALLERY_DIR, file));
                if (stats.isDirectory()) {
                    await readdir(path.join(GALLERY_DIR, file)).then(
                        async (albums) => {
                            const albumList: Album[] = [];
                            for (const album of albums) {
                                const albumStats = await stat(
                                    path.join(GALLERY_DIR, file, album),
                                );
                                if (albumStats.isDirectory()) {
                                    const thumbnailDir = path.join(
                                        GALLERY_DIR,
                                        file,
                                        album,
                                        'thumbnails',
                                    );
                                    await mkdir(thumbnailDir, {
                                        recursive: true,
                                    });
                                    const imageList: Image[] = [];

                                    const images = await readdir(thumbnailDir);
                                    for (const image of images) {
                                        const imageStats = await stat(
                                            path.join(thumbnailDir, image),
                                        );
                                        if (imageStats.isFile()) {
                                            const isJpg = image
                                                .toLowerCase()
                                                .endsWith('.jpg');
                                            if (isJpg) {
                                                const imageName =
                                                    path.parse(image).name;
                                                let ratio = 1;

                                                // Charger le ratio depuis les métadonnées
                                                try {
                                                    const metadata =
                                                        await sharp(
                                                            path.join(
                                                                thumbnailDir,
                                                                image,
                                                            ),
                                                        ).metadata();
                                                    if (
                                                        metadata.width &&
                                                        metadata.height
                                                    ) {
                                                        ratio =
                                                            metadata.width /
                                                            metadata.height;
                                                    }
                                                } catch (metaErr) {
                                                    logger.warn(
                                                        `Could not read metadata for ${imageName}`,
                                                    );
                                                }

                                                imageList.push({
                                                    name: imageName,
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
                                name: file,
                                albums: albumList,
                            });
                        },
                    );
                }
            }
        });
    }

    async health() {
        this.galleries.forEach((gallery) => {
            logger.info(`Loaded gallery ${gallery.name}`);
            gallery.albums.forEach((album) => {
                logger.info(
                    `Loaded album ${album.name} with ${album.images.length} images`,
                );
            });
        });
        return readdir(GALLERY_DIR).then(() => {
            return;
        });
    }

    async gallery(name: string): Promise<Gallery | null> {
        const gallery = this.galleries.find((g) => g.name === name);
        return gallery || null;
    }

    async getImage(
        galleryName: string,
        filename: string,
    ): Promise<Buffer | null> {
        const gallery = this.galleries.find((g) => g.name === galleryName);
        if (!gallery) return null;

        for (const album of gallery.albums) {
            if (album.images.some((img) => img.name === filename)) {
                // Ajouter l'extension .jpg pour construire le chemin du fichier
                const imageFilename = `${filename}.jpg`;
                const imagePath = path.join(
                    GALLERY_DIR,
                    galleryName,
                    album.name,
                    'thumbnails',
                    imageFilename,
                );
                console.log('Image path:', imagePath);

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

    async getImageRatio(
        galleryName: string,
        filename: string,
    ): Promise<number> {
        const gallery = this.galleries.find((g) => g.name === galleryName);
        if (!gallery) return 1;

        for (const album of gallery.albums) {
            const image = album.images.find((img) => img.name === filename);
            if (image) {
                try {
                    const imageFilename = `${filename}.jpg`;
                    const imagePath = path.join(
                        GALLERY_DIR,
                        galleryName,
                        album.name,
                        'thumbnails',
                        imageFilename,
                    );

                    const metadata = await sharp(imagePath).metadata();
                    if (metadata.width && metadata.height) {
                        const ratio = metadata.width / metadata.height;
                        // Mettre à jour le ratio dans la galerie en cache
                        image.ratio = ratio;
                        return ratio;
                    }
                } catch (error) {
                    logger.warn(`Could not get ratio for ${filename}`);
                }
            }
        }
        return 1;
    }

    async addImages(
        galleryName: string,
        albumName: string,
        files: File[],
    ): Promise<void> {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        const albumDirPath = path.join(galleryDirPath, albumName);
        const thumbnailDirPath = path.join(albumDirPath, 'thumbnails');

        // Ensure the album directory exists
        await mkdir(albumDirPath, { recursive: true });
        await mkdir(thumbnailDirPath, { recursive: true });

        // Trouver le prochain numéro séquentiel basé sur les fichiers existants dans la galerie
        const existingFiles = await readdir(galleryDirPath).catch(() => []);
        const pattern = new RegExp(`^(\\d+)\\.jpg$`, 'i');
        let maxIndex = 0;

        // Scanner tous les albums de la galerie pour trouver le plus grand index
        for (const galleryItem of existingFiles) {
            const itemPath = path.join(galleryDirPath, galleryItem);
            const itemStats = await stat(itemPath).catch(() => null);
            if (itemStats?.isDirectory()) {
                const itemFiles = await readdir(itemPath).catch(() => []);
                for (const itemFile of itemFiles) {
                    const match = itemFile.match(pattern);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        if (index > maxIndex) maxIndex = index;
                    }
                }
            }
        }
        let currentIndex = maxIndex + 1;

        // Copy each image to the album directory
        for (const file of files) {
            // Générer le nouveau nom de fichier avec 4 chiffres (ex: 0001.jpg, 0256.jpg)
            const filename = `${String(currentIndex).padStart(4, '0')}.jpg`;
            currentIndex++;

            // Convertir File en Buffer
            const buffer = await file.arrayBuffer();

            // Thumbnail generation
            const thumbnailPath = path.join(thumbnailDirPath, filename);
            await this.generateThumbnail(buffer, thumbnailPath);

            // Copy the image file to the album directory
            const imagePath = path.join(albumDirPath, filename);
            await this.saveImageBuffer(buffer, imagePath);
        }
        this.init();
    }

    private async generateThumbnail(
        buffer: ArrayBuffer,
        thumbnailPath: string,
    ): Promise<void> {
        await sharp(Buffer.from(buffer))
            .resize(200, 200, { fit: 'cover' })
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
