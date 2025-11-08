import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';

import { Album, Gallery, Image } from './gallery.types';

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

        // Charger les galeries existantes
        this.galleries = [];
        await readdir(GALLERY_DIR).then(async (galleries) => {
            for (const galleryName of galleries.filter(
                (name) => name !== 'thumbnails',
            )) {
                const galleryPath = path.join(GALLERY_DIR, galleryName);
                const stats = await stat(galleryPath);
                if (stats.isDirectory()) {
                    await readdir(galleryPath).then(async (albums) => {
                        const albumList: Album[] = [];
                        for (const album of albums) {
                            const albumPath = path.join(galleryPath, album);
                            const albumStats = await stat(albumPath);
                            if (albumStats.isDirectory()) {
                                const imageList: Image[] = [];
                                const images = await readdir(albumPath);
                                for (const image of images) {
                                    const imagePath = path.join(
                                        albumPath,
                                        image,
                                    );
                                    const imageStats = await stat(imagePath);
                                    if (imageStats.isFile()) {
                                        const isJpg = image
                                            .toLowerCase()
                                            .endsWith('.jpg');
                                        if (isJpg) {
                                            const name = path.parse(image).name;

                                            const ratio =
                                                await this.getImageRatio(
                                                    imagePath,
                                                );

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
                            name: galleryName,
                            albums: albumList,
                        });
                    });
                }
            }
        });

        // Renommer les images pour qu'elles aient des noms séquentiels
        /*this.galleries.forEach(async (gallery) => {
            let index = await this.nextImageIndex(
                path.join(GALLERY_DIR, gallery.name),
            );
            gallery.albums.forEach(async (album) => {
                for (const image of album.images) {
                    const match = image.name.match(IMAGE_NAME_PATTERN);
                    if (!match) {
                        const oldPath = path.join(
                            GALLERY_DIR,
                            gallery.name,
                            album.name,
                            `${image.name}.jpg`,
                        );
                        const newName = String(index).padStart(4, '0');
                        const newPath = path.join(
                            GALLERY_DIR,
                            gallery.name,
                            album.name,
                            `${newName}.jpg`,
                        );
                        await rename(oldPath, newPath);
                        index++;
                    }
                }
            });
        });*/

        // Générer les vignettes pour les images existantes
        this.generateThumbnails(true);
    }

    async add(galleryName: string) {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        await mkdir(galleryDirPath, { recursive: true });

        this.galleries.push({
            name: galleryName,
            albums: [],
        });
    }

    async delete(galleryName: string) {
        const galleryDirPath = path.join(GALLERY_DIR, galleryName);
        await rm(galleryDirPath, { recursive: true });
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

    async get(name: string): Promise<Gallery | null> {
        const gallery = this.galleries.find((g) => g.name === name);
        return gallery || null;
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

            // Update internal state
            this.galleries
                .find((g) => g.name === galleryName)
                ?.albums.find((a) => a.name === albumName)
                ?.images.push({
                    name: path.parse(filename).name,
                    ratio: await this.getImageRatio(imagePath),
                });
        }
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
}
