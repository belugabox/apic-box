import { arktypeValidator } from '@hono/arktype-validator';
import archiver from 'archiver';
import { type } from 'arktype';
import bcrypt from 'bcryptjs';
import { Context, Hono } from 'hono';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';
import { addImageWatermark } from 'sharp-watermark';

import { db } from '@server/db';
import { isRequestAborted } from '@server/tools/abortMiddleware';
import { MemoryCache } from '@server/tools/cache';
import { DATA_FILE_PATH, GALLERY_JWT_SECRET } from '@server/tools/env';
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from '@server/tools/errorHandler';
import { generateExcel } from '@server/tools/excel';
import { logger } from '@server/tools/logger';

import { Module, ModuleRepository } from '..';
import { UserRole } from '../auth/types';
import { EntityStatus } from '../shared.types';
import { Utils } from '../utils';
import { Album, Gallery, Image } from './types';

const GALLERY_DIR = path.resolve(DATA_FILE_PATH, 'gallery');
const THUMBNAIL_DIR = 'thumbnails';
const WATERMARK_PATH = path.resolve('./assets/watermark.png');
const IMAGE_THUMBNAIL_SIZE = 500;

export class GalleryModule implements Module {
    name = 'Gallery';
    private imageCache = new MemoryCache<Buffer>(30 * 60 * 1000); // 30 minutes

    repo = () => {
        return new ModuleRepository<Gallery>(db.getRepository(Gallery));
    };
    repoAlbum = () => {
        return new ModuleRepository<Album>(db.getRepository(Album));
    };
    repoImage = () => {
        return new ModuleRepository<Image>(db.getRepository(Image));
    };

    init = async () => {
        // Ensure gallery directory exists
        await mkdir(GALLERY_DIR, { recursive: true });

        // Check if watermark image exists
        if ((await existsSync(WATERMARK_PATH)) === false) {
            logger.warn(
                `Watermark image not found at ${WATERMARK_PATH}, skipping watermarking`,
            );
        }
    };

    health = async () => {
        await this.repo().count();
    };

    routes = () => {
        return new Hono()
            .get('/all', async (c) => {
                const isAdmin = await Utils.authIsAdmin(c);
                return c.json({
                    galleries: (await this.all(isAdmin)).map((g) => g.toDTO()),
                });
            })
            .get('/latest', async (c) => {
                const isAdmin = await Utils.authIsAdmin(c);
                return c.json({
                    gallery: (await this.latest(isAdmin))?.toDTO(),
                });
            })
            .get(
                '/:id',
                this.checkAccess(),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const isAdmin = await Utils.authIsAdmin(c);
                    const gallery = await this.get(id, isAdmin);
                    if (!gallery) {
                        throw new NotFoundError(`Gallery ${id} not found`);
                    }
                    return c.json({ gallery: gallery.toDTO() });
                },
            )
            .post(
                '/add',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        name: 'string',
                        description: 'string',
                        status: type.valueOf(EntityStatus),
                    }),
                ),
                async (c) => {
                    const { name, description, status } = c.req.valid('form');
                    return c.json({
                        gallery: (
                            await this.add({ name, description, status })
                        ).toDTO(),
                    });
                },
            )
            .patch(
                '/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        name: 'string',
                        description: 'string',
                        status: type.valueOf(EntityStatus),
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { name, description, status } = c.req.valid('form');
                    const updated = await this.edit(id, {
                        name,
                        description,
                        status,
                    });
                    if (!updated) {
                        throw new NotFoundError(`Gallery ${id} not found`);
                    }
                    return c.json({ gallery: updated.toDTO() });
                },
            )
            .delete(
                '/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const success = await this.delete(id);
                    if (!success) {
                        throw new NotFoundError(`Gallery ${id} not found`);
                    }
                    return c.json({ success });
                },
            )
            .patch(
                '/:id/updatePassword',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        password: 'string | null',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { password } = c.req.valid('form');
                    if (!password || password === '') {
                        await this.removePassword(id);
                        return c.json({ message: 'Password removed' });
                    }
                    await this.setPassword(id, password);
                    return c.json({ message: 'Password updated' });
                },
            )
            .post(
                '/:id/updateCover',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        file: 'File',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { file } = c.req.valid('form');
                    await this.setCover(Number(id), file);
                    return c.json({ message: 'Cover updated' });
                },
            )
            .get(
                '/:id/cover',
                this.checkAccess(),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const isAdmin = await Utils.authIsAdmin(c);
                    const gallery = await this.repo().get(
                        Number(id),
                        !isAdmin
                            ? { status: EntityStatus.PUBLISHED }
                            : undefined,
                    );
                    if (!gallery) {
                        throw new NotFoundError('Gallery not found');
                    }
                    const coverPath = gallery.pathCover!();
                    const coverBuffer = await readFile(coverPath);
                    c.header('Content-Type', 'image/png');
                    c.header(
                        'Cache-Control',
                        'public, max-age=31536000, immutable',
                    );
                    return c.body(coverBuffer);
                },
            )
            .post(
                '/:id/login',
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        password: 'string',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { password } = c.req.valid('form');
                    const token = await this.login(id, password);
                    if (!token) {
                        throw new BadRequestError('Code secret invalide');
                    }
                    return c.json({ token });
                },
            )
            .get(
                '/:id/export',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const result = await this.export(id);
                    if (!result || !result.blob) {
                        throw new NotFoundError('Export failed');
                    }
                    c.header(
                        'Content-Disposition',
                        `attachment; filename="gallery.zip"`,
                    );
                    c.header('Content-Type', 'application/zip');
                    c.header(
                        'Cache-Control',
                        'public, max-age=31536000, immutable',
                    );
                    const arrayBuffer = await result.blob.arrayBuffer();
                    return c.body(arrayBuffer);
                },
            )
            .post(
                '/:id/reorderAlbums',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'json',
                    type({
                        albumOrders: type({
                            albumId: 'number',
                            orderIndex: 'number',
                        }).array(),
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { albumOrders } = c.req.valid('json');
                    await this.reorderAlbums(Number(id), albumOrders);
                    return c.json({ message: 'Albums reordered' });
                },
            )
            .post(
                '/:id/addAlbum',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.numeric' })),
                arktypeValidator(
                    'form',
                    type({
                        name: 'string',
                        code: 'string',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { name, code } = c.req.valid('form');
                    await this.addAlbum(Number(id), { name, code });
                    return c.json({ message: 'Album added' });
                },
            )
            .patch(
                '/album/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        name: 'string',
                        code: 'string',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { name, code } = c.req.valid('form');
                    await this.editAlbum(id, { name, code });
                    return c.json({ message: 'Album updated' });
                },
            )
            .delete(
                '/album/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    await this.deleteAlbum(id);
                    return c.json({ message: 'Album deleted' });
                },
            )
            .get(
                '/image/:imageId',
                this.checkAccess(),
                arktypeValidator(
                    'param',
                    type({ imageId: 'string.integer.parse' }),
                ),
                async (c) => {
                    const startTime = Date.now();

                    if (isRequestAborted(c)) {
                        return c.json({ error: 'Request aborted' }, 408);
                    }

                    const { imageId: parsedId } = c.req.valid('param');

                    // Get image from DB
                    const getImageStart = Date.now();
                    const image = await this.getImage(Number(parsedId));
                    const getImageDuration = Date.now() - getImageStart;

                    if (!image) {
                        throw new NotFoundError('Image not found');
                    }

                    if (isRequestAborted(c)) {
                        return c.json({ error: 'Request aborted' }, 408);
                    }

                    // Read file from disk (with cache)
                    const readFileStart = Date.now();
                    const thumbnail = await this.imageCache.get(
                        Number(parsedId),
                        () => readFile(image.path!(true)),
                    );
                    const readFileDuration = Date.now() - readFileStart;

                    c.header('Content-Type', 'image/jpeg');
                    c.header(
                        'Cache-Control',
                        'public, max-age=31536000, immutable',
                    );

                    const totalDuration = Date.now() - startTime;
                    logger.debug(
                        `Image request completed (DB: ${getImageDuration}ms, IO: ${readFileDuration}ms, Total: ${totalDuration}ms)`,
                    );

                    return c.body(new Uint8Array(thumbnail));
                },
            )
            .post(
                '/album/:id/addImages',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                arktypeValidator(
                    'form',
                    type({
                        files: 'File | File[]',
                    }),
                ),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const { files } = c.req.valid('form');
                    const fileArray = Array.isArray(files) ? files : [files];
                    if (!fileArray || fileArray.length === 0) {
                        throw new BadRequestError('Aucun fichier fourni');
                    }
                    await this.addImages(id, fileArray);
                    return c.json({ message: 'Images added' });
                },
            )
            .delete(
                '/image/:id',
                Utils.authMiddleware(UserRole.ADMIN),
                arktypeValidator('param', type({ id: 'string.integer.parse' })),
                async (c) => {
                    const { id } = c.req.valid('param');
                    const success = await this.deleteImage(id);
                    if (!success) {
                        throw new NotFoundError(`Image ${id} not found`);
                    }
                    return c.json({ success });
                },
            );
    };

    // ---
    private wherePublished(isAdmin?: boolean) {
        return !isAdmin ? { status: EntityStatus.PUBLISHED } : {};
    }

    // ---
    all = async (isAdmin?: boolean): Promise<Gallery[]> => {
        return await this.repo().find({
            relations: ['albums'],
            where: this.wherePublished(isAdmin),
            order: { createdAt: 'DESC' },
        });
    };

    latest = async (isAdmin?: boolean): Promise<Gallery | null> => {
        return await this.repo().findOne({
            relations: ['albums'],
            where: this.wherePublished(isAdmin),
            order: { createdAt: 'DESC' },
        });
    };

    get = async (id: number, isAdmin?: boolean): Promise<Gallery | null> => {
        return await await this.repo().findOne({
            relations: ['albums'],
            where: { id, ...this.wherePublished(isAdmin) },
        });
    };

    add = async (item: {
        name: string;
        description: string;
        status: EntityStatus;
    }): Promise<Gallery> => {
        const newGallery = await this.repo().add(item);

        // Create gallery directory
        await mkdir(newGallery.path!(), { recursive: true });

        return newGallery;
    };

    edit = async (
        id: number,
        item: {
            name: string;
            description: string;
            status: EntityStatus;
        },
    ): Promise<Gallery | null> => {
        return await this.repo().edit(id, item);
    };

    delete = async (id: number): Promise<boolean> => {
        const gallery = await this.repo().get(id);
        if (!gallery) {
            return false;
        }

        // Remove gallery directory
        await rm(gallery.path!(), { recursive: true, force: true });

        return await this.repo().deleteById(id);
    };

    // Password
    async setPassword(galleryId: number, password: string): Promise<void> {
        await this.repo().edit(galleryId, {
            password: await Utils.hashPassword(password),
        });
    }

    async removePassword(galleryId: number): Promise<void> {
        await this.repo().edit(galleryId, { password: '' });
    }

    // Cover
    setCover = async (galleryId: number, file: File): Promise<void> => {
        const gallery = await this.repo().get(galleryId);
        if (!gallery) {
            return;
        }
        await generateThumbnail(
            await file.arrayBuffer(),
            gallery.pathCover!(),
            false,
            600,
        );

        await this.repo().edit(galleryId, {});
    };

    // Albums
    addAlbum = async (
        galleryId: number,
        album: {
            name: string;
            code: string;
        },
    ): Promise<Album> => {
        // Add album into database
        const gallery = await this.repo().get(galleryId);
        if (!gallery) {
            throw new Error('Gallery not found');
        }

        const nextOrderIndex = await this.repoAlbum().countBy({
            gallery: { id: galleryId },
        });

        const newAlbum = await this.repoAlbum().add({
            ...album,
            code: album.code?.toUpperCase(),
            gallery: gallery,
            orderIndex: nextOrderIndex,
        });

        // Create album directory if not exists
        await mkdir(newAlbum.path!(), { recursive: true });

        return newAlbum;
    };
    editAlbum = async (
        albumId: number,
        album: Partial<
            Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'toDTO' | 'gallery'>
        >,
    ): Promise<Album | null> => {
        // Update album into database
        const updatedAlbum = await this.repoAlbum().edit(albumId, {
            ...album,
            code: album.code?.toUpperCase(),
        });

        return updatedAlbum;
    };

    deleteAlbum = async (albumId: number): Promise<boolean> => {
        // ---
        const album = await this.repoAlbum().findOne({
            where: { id: albumId },
            relations: ['gallery', 'images'],
        });
        if (!album) {
            logger.warn(`Album ${albumId} not found for delete`);
            return false;
        }

        // Delete all images first (to respect foreign key constraints)
        if (album.images && album.images.length > 0) {
            await this.repoImage().remove(album.images);
        }

        // Remove album directory
        await rm(album.path!(), { recursive: true, force: true });

        // Delete album from database
        await this.repoAlbum().remove(album);

        return true;
    };

    reorderAlbums = async (
        _galleryId: number,
        albumOrders: Array<{ albumId: number; orderIndex: number }>,
    ): Promise<void> => {
        for (const { albumId, orderIndex } of albumOrders) {
            await this.editAlbum(albumId, { orderIndex });
        }
    };

    getImage = async (imageId: number): Promise<Image | null> => {
        return await this.repoImage().findOne({
            where: { id: imageId },
            relations: ['album', 'album.gallery'],
        });
    };

    addImages = async (albumId: number, files: File[]): Promise<void> => {
        const album = await this.repoAlbum().findOne({
            where: { id: albumId },
            relations: ['gallery', 'images'],
        });
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        for (const file of files) {
            await this.addImage(album.id, file);
        }
    };

    addImage = async (albumId: number, file: File): Promise<void> => {
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
        const album = await this.repoAlbum().findOne({
            where: { id: albumId },
            relations: ['gallery'],
        });
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        const albumPath = album.path!();
        const existingFiles = await readdir(albumPath).catch(() => []);
        let maxIndex = 0;
        for (const galleryItem of existingFiles) {
            // Skip thumbnails directory
            if (galleryItem === THUMBNAIL_DIR) {
                continue;
            }
            const match = galleryItem.match(/^(\d+)\.[a-zA-Z0-9]+$/i);
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
        const code = `${shortCode}`;
        const filename = `${shortCode}${path.extname(file.name)}`;

        // add image to database
        const newImage = await this.repoImage().add({
            filename,
            code,
            ratio,
            album,
        });

        // save image file
        await saveImageBuffer(await file.arrayBuffer(), newImage.path!());

        // generate thumbnail
        await mkdir(path.join(albumPath, THUMBNAIL_DIR), { recursive: true });
        await generateThumbnail(await file.arrayBuffer(), newImage.path!(true));
    };

    deleteImage = async (imageId: number): Promise<boolean> => {
        const image = await this.repoImage().findOne({
            where: { id: imageId },
            relations: ['album', 'album.gallery'],
        });
        if (!image) {
            return false;
        }
        // Remove image file
        await rm(image.path!(), { force: true });
        // Remove thumbnail file
        await rm(image.path!(true), { force: true });
        // Delete image from database
        await this.repoImage().remove(image);
        return true;
    };

    // Login
    async login(galleryId: number, password: string): Promise<string | null> {
        const gallery = await this.repo().findOneBy({
            id: galleryId,
        });
        if (!gallery?.password) {
            return null; // Galerie non protégée
        }
        const hashedPassword = gallery.password;

        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return null; // Mot de passe incorrect
        }

        // Générer un token JWT
        const token = await Utils.signToken({ galleryId }, GALLERY_JWT_SECRET);
        return token;
    }

    checkAccess = () => async (c: Context, next: () => Promise<void>) => {
        // Récupérer le galleryId depuis le paramètre de route
        let galleryId: number;

        // Si c'est une route d'image, récupérer l'image d'abord pour obtenir le galleryId
        const imageIdParam = c.req.param('imageId');
        if (imageIdParam) {
            const image = await this.repoImage().findOne({
                where: { id: Number(imageIdParam) },
                relations: ['album', 'album.gallery'],
            });
            if (!image) {
                throw new NotFoundError('Image not found');
            }
            galleryId = image.album.gallery.id;
        } else {
            // Sinon, récupérer directement le galleryId
            galleryId = Number(c.req.param('id'));
        }

        const token = c.req.header('X-Gallery-Token');

        const gallery = await this.repo().findOneBy({
            id: galleryId,
        });
        if (!gallery?.password) {
            // Galerie non protégée, accès libre
            return await next();
        }

        // Galerie protégée, vérifier le token
        if (!token) {
            return await Utils.authMiddleware(UserRole.ADMIN)(c, next);
            //throw new UnauthorizedError('No token provided');
        }

        const payload = await Utils.verifyToken<{ galleryId: number }>(
            token,
            GALLERY_JWT_SECRET,
        );
        if (!payload || payload.galleryId !== galleryId) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Token valide, continuer
        return await next();
    };

    // Export
    export = async (
        galleryId: number,
    ): Promise<{ gallery: Gallery; blob: Blob } | null> => {
        const gallery = await this.repo().findOne({
            where: { id: galleryId },
            relations: [
                'albums',
                'albums.images',
                'albums.images.album',
                'albums.images.album.gallery',
            ],
        });
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
            if (album?.images) {
                for (const image of album.images) {
                    data.push({
                        Album: album.name,
                        Code: image.fullcode,
                    });
                }
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
            if (album?.images) {
                for (const image of album.images) {
                    try {
                        const imageBuffer = await readFile(image.path!());
                        archive.append(imageBuffer, {
                            name: path.join(
                                'photos',
                                image.fullcode + path.extname(image.filename),
                            ),
                        });
                    } catch (err) {
                        logger.warn(
                            err,
                            `Failed to add image ${image.id} to archive`,
                        );
                    }
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
                resolve({ gallery, blob });
            });

            archive.on('error', (err: Error) => {
                logger.error(err, 'Failed to create archive');
                reject(err);
            });

            archive.finalize();
        });
    };
}

// Utils
const generateThumbnail = async (
    buffer: ArrayBuffer,
    thumbnailPath: string,
    watermark: boolean = true,
    size?: number,
): Promise<void> => {
    // Detect if this is a cover image based on the path
    const isCover = thumbnailPath.includes('cover.png');
    const format = isCover ? 'png' : 'jpeg';

    const resized = sharp(buffer).resize(
        size || IMAGE_THUMBNAIL_SIZE,
        size || IMAGE_THUMBNAIL_SIZE,
        {
            fit: 'inside',
        },
    );

    const thumbnailBuffer = await (format === 'png'
        ? resized.png().toBuffer()
        : resized.jpeg({ quality: 90 }).toBuffer());

    if ((await existsSync(WATERMARK_PATH)) === false) {
        logger.warn(
            `Watermark image not found at ${WATERMARK_PATH}, skipping watermarking`,
        );
        await sharp(thumbnailBuffer).toFile(thumbnailPath);
        return;
    }

    if (!watermark) {
        await sharp(thumbnailBuffer).toFile(thumbnailPath);
        return;
    }

    const watermarkedBuffer = await addImageWatermark(
        thumbnailBuffer,
        WATERMARK_PATH,
        { position: 'bottomRight', opacity: 0.3, ratio: 0.3 },
    );

    await watermarkedBuffer.toFile(thumbnailPath);
    return;
};

const saveImageBuffer = async (
    buffer: ArrayBuffer,
    imagePath: string,
): Promise<void> => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(imagePath, Buffer.from(buffer));
};
