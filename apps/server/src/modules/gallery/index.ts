import { arktypeValidator } from '@hono/arktype-validator';
import archiver from 'archiver';
import { type } from 'arktype';
import bcrypt from 'bcryptjs';
import { Context, Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'path';
import sharp from 'sharp';
import { addImageWatermark } from 'sharp-watermark';
import {
    AfterLoad,
    Column,
    DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    Repository,
} from 'typeorm';

import { AuthRole } from '@server/auth';
import { authManager } from '@server/core';
import { AppDataSource } from '@server/db';
import { DATA_FILE_PATH, GALLERY_JWT_SECRET } from '@server/tools/env';
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
    errorHandler,
} from '@server/tools/errorHandler';
import { generateExcel } from '@server/tools/excel';
import { logger } from '@server/tools/logger';

import { BaseModule, EntityWithDefaultColumns } from '../base.module';
import { EntityStatus } from '../shared.types';

const GALLERY_DIR = path.resolve(DATA_FILE_PATH, 'gallery');
const THUMBNAIL_DIR = 'thumbnails';
const WATERMARK_PATH = path.resolve('./assets/watermark.png');
const IMAGE_THUMBNAIL_SIZE = 500;

export class GalleryModule extends BaseModule<Gallery> {
    private albumRepo!: Repository<Album>;
    private imageRepo!: Repository<Image>;

    constructor() {
        super('Gallery', Gallery, GalleryAddSchema, GalleryEditSchema);
    }

    async init() {
        await super.init();
        this.albumRepo = AppDataSource.getRepository(Album);
        this.imageRepo = AppDataSource.getRepository(Image);

        // Ensure gallery directory exists
        await mkdir(GALLERY_DIR, { recursive: true });

        // Check if watermark image exists
        if ((await existsSync(WATERMARK_PATH)) === false) {
            logger.warn(
                `Watermark image not found at ${WATERMARK_PATH}, skipping watermarking`,
            );
        }
    }

    // ---
    all = async (): Promise<Gallery[]> => {
        const galleries = await this.repo.find({
            relations: ['albums', 'albums.images', 'albums.images.album'],
        });
        return galleries.map((gallery) => ({
            ...gallery,
            password: undefined,
            albums: gallery.albums?.sort(
                (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0),
            ),
        }));
    };

    get = async (id: number): Promise<Gallery | null> => {
        const gallery = await this.repo.findOne({
            where: { id },
            relations: ['albums', 'albums.images', 'albums.images.album'],
        });
        return (
            gallery && {
                ...gallery,
                password: undefined,
                albums: gallery?.albums?.sort(
                    (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0),
                ),
            }
        );
    };

    add = async (
        item: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<Gallery> => {
        const newGallery = await super.add(item);

        // Create gallery directory
        await mkdir(newGallery.path!(), { recursive: true });

        return newGallery;
    };

    delete = async (id: number): Promise<boolean> => {
        const gallery = await this.get(id);
        if (!gallery) {
            return false;
        }

        // Remove gallery directory
        await rm(gallery.path!(), { recursive: true, force: true });

        return super.delete(id);
    };

    // Password
    removePassword = async (galleryId: number): Promise<void> => {
        await this.repo.update(galleryId, { password: '' });
    };

    setPassword = async (
        galleryId: number,
        password: string,
    ): Promise<void> => {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.repo.update(galleryId, { password: hashedPassword });
    };

    // Cover
    setCover = async (galleryId: number, file: File): Promise<void> => {
        const gallery = await this.get(galleryId);
        if (!gallery) {
            return;
        }
        await generateThumbnail(
            await file.arrayBuffer(),
            gallery.pathCover!(),
            false,
            600,
        );

        await this.repo.update(galleryId, {
            updatedAt: new Date().toISOString(),
        });
    };

    // Login
    async login(galleryId: number, password: string): Promise<string | null> {
        const gallery = await this.repo.findOneBy({
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

    checkAccess = () => async (c: Context, next: () => Promise<void>) => {
        const galleryId = Number(c.req.param('id'));
        const token = c.req.header('X-Gallery-Token');

        const gallery = await this.repo.findOneBy({
            id: galleryId,
        });
        if (!gallery?.password) {
            // Galerie non protégée, accès libre
            return await next();
        }
        const hashedPassword = gallery.password;

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

    // Export
    export = async (
        galleryId: number,
    ): Promise<{ gallery: Gallery; blob: Blob } | null> => {
        const gallery = await this.repo.findOne({
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

    // Album
    addAlbum = async (
        galleryId: number,
        album: Omit<
            Album,
            'id' | 'createdAt' | 'updatedAt' | 'gallery' | 'orderIndex'
        >,
    ): Promise<Album> => {
        // Add album into database
        const gallery = await this.get(galleryId);
        if (!gallery) {
            throw new Error('Gallery not found');
        }

        const nextOrderIndex = await this.albumRepo.countBy({
            gallery: { id: galleryId },
        });

        const newAlbum = this.albumRepo.create({
            ...album,
            code: album.code?.toUpperCase(),
            gallery: gallery,
            orderIndex: nextOrderIndex,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<Album>);
        const savedAlbum = await this.albumRepo.save(newAlbum);

        // Create album directory if not exists
        await mkdir(savedAlbum.path!(), { recursive: true });

        logger.info({ item: savedAlbum }, `GalleryModule > addAlbum`);
        return savedAlbum;
    };

    updateAlbum = async (
        albumId: number,
        album: Partial<
            Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'gallery'>
        >,
    ): Promise<Album | null> => {
        // Update album into database
        const existingAlbum = await this.albumRepo.findOneBy({ id: albumId });
        if (!existingAlbum) {
            logger.warn(`Album ${albumId} not found for update`);
            return null;
        }
        const updatedAlbum = this.albumRepo.merge(existingAlbum, {
            ...album,
            code: album.code?.toUpperCase() ?? existingAlbum.code,
            updatedAt: new Date(),
        });
        const savedAlbum = await this.albumRepo.save(updatedAlbum);

        logger.info({ item: savedAlbum }, `GalleryModule > updateAlbum`);
        return savedAlbum;
    };

    deleteAlbum = async (albumId: number): Promise<boolean> => {
        // ---
        const album = await this.albumRepo.findOne({
            where: { id: albumId },
            relations: ['gallery', 'images'],
        });
        if (!album) {
            logger.warn(`Album ${albumId} not found for delete`);
            return false;
        }

        // Delete all images first (to respect foreign key constraints)
        if (album.images && album.images.length > 0) {
            await this.imageRepo.remove(album.images);
        }

        // Remove album directory
        await rm(album.path!(), { recursive: true, force: true });

        // Delete album from database
        await this.albumRepo.remove(album);

        logger.info({ item: album }, `GalleryModule > deleteAlbum`);
        return true;
    };

    reorderAlbums = async (
        galleryId: number,
        albumOrders: Array<{ albumId: number; orderIndex: number }>,
    ): Promise<void> => {
        logger.info(`Reordering albums for gallery ${galleryId}`);
        for (const { albumId, orderIndex } of albumOrders) {
            logger.info(
                ` - Setting album ${albumId} to order index ${orderIndex}`,
            );
            await this.updateAlbum(albumId, { orderIndex });
        }
        logger.info(`Albums reordered for gallery ${galleryId}`);
    };

    addImages = async (albumId: number, files: File[]): Promise<void> => {
        const album = await this.albumRepo.findOne({
            where: { id: albumId },
            relations: ['gallery', 'images'],
        });
        if (!album) {
            throw new Error(`Album ${albumId} not found`);
        }
        logger.info(`Adding ${files.length} images to album ${albumId}`);
        for (const file of files) {
            await this.addImage(album.id, file);
        }
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
        const album = await this.albumRepo.findOne({
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
        const newImage = await this.imageRepo.create({
            filename,
            code,
            ratio,
            album,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<Image>);
        const savedImage = await this.imageRepo.save(newImage);
        const imageId = savedImage.id;
        if (!imageId) {
            logger.error(`Failed to create image in album ${albumId}`);
            throw new Error('Failed to create image');
        }

        // save image file
        await saveImageBuffer(await file.arrayBuffer(), savedImage.path!());

        // generate thumbnail
        await mkdir(path.join(albumPath, THUMBNAIL_DIR), { recursive: true });
        await generateThumbnail(
            await file.arrayBuffer(),
            savedImage.path!(true),
        );

        logger.info(`Image added with ID: ${imageId}, code: ${code}`);
    };

    deleteImage = async (imageId: number): Promise<boolean> => {
        const image = await this.imageRepo.findOne({
            where: { id: imageId },
            relations: ['album', 'album.gallery'],
        });
        if (!image) {
            logger.warn(`Image ${imageId} not found for delete`);
            return false;
        }
        // Remove image file
        await rm(image.path!(), { force: true });
        // Remove thumbnail file
        await rm(image.path!(true), { force: true });
        // Delete image from database
        await this.imageRepo.remove(image);
        return true;
    };

    // ---
    routes() {
        return new Hono()
            .onError(errorHandler)
            .all('/', async (c) => {
                const items = await this.all();
                return c.json(items);
            })
            .get('/all', async (c) => {
                const items = await this.all();
                return c.json(items);
            })
            .get('/latest', async (c) => {
                const items = await this.all();
                const sortedItems = items.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                );
                const latestBlog = sortedItems[0];
                return c.json(latestBlog);
            })
            .get('/:id', this.checkAccess(), async (c) => {
                const id = Number(c.req.param('id'));
                const item = await this.get(id);
                if (!item) {
                    throw new NotFoundError(
                        `Item ${this.name} ${id} not found`,
                    );
                }
                return c.json(item);
            })
            .post(
                '/add',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator('form', this.addSchema),
                async (c) => {
                    const formData = c.req.valid('form');
                    const newItem = await this.add(formData);
                    return c.json({ message: 'Item added', item: newItem });
                },
            )
            .patch(
                '/:id',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator('form', this.editSchema),
                async (c) => {
                    const formData = c.req.valid('form');
                    const id = Number(c.req.param('id'));
                    const updatedItem = await this.edit(id, formData);
                    if (!updatedItem) {
                        throw new NotFoundError(
                            `Item ${this.name} ${id} not found`,
                        );
                    }
                    return c.json({
                        message: 'Item edited',
                        item: updatedItem,
                    });
                },
            )
            .delete(
                '/:id',
                authManager.authMiddleware(AuthRole.ADMIN),
                async (c) => {
                    const id = Number(c.req.param('id'));
                    const success = await this.delete(id);
                    if (!success) {
                        throw new NotFoundError(
                            `Item ${this.name} ${id} not found`,
                        );
                    }
                    return c.json({ message: 'Item deleted' });
                },
            )
            .post(
                '/:galleryId/updatePassword',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        password: 'string | null',
                    }),
                ),
                async (c) => {
                    const galleryId = Number(c.req.param('galleryId'));
                    const { password } = c.req.valid('form');
                    if (!password || password === '') {
                        await this.removePassword(galleryId);
                        return c.json({ message: 'Password removed' });
                    }
                    await this.setPassword(galleryId, password);
                    return c.json({ message: 'Password updated' });
                },
            )

            .post(
                '/:galleryId/updateCover',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        file: 'File',
                    }),
                ),
                async (c) => {
                    const galleryId = Number(c.req.param('galleryId'));
                    const { file } = c.req.valid('form');
                    await this.setCover(galleryId, file);
                    return c.json({ message: 'Images added' });
                },
            )
            .get('/:galleryId/cover', async (c) => {
                const galleryId = Number(c.req.param('galleryId'));
                const gallery = await this.repo.findOne({
                    where: { id: galleryId },
                });
                if (!gallery) {
                    throw new NotFoundError(
                        `Cover for gallery ${galleryId} not found`,
                    );
                }
                const cover = await readFile(gallery.pathCover!());
                c.header('Content-Type', 'image/png');
                c.header(
                    'Cache-Control',
                    'public, max-age=31536000, immutable',
                );
                return c.body(new Uint8Array(cover));
            })

            .post(
                '/:galleryId/login',
                arktypeValidator(
                    'form',
                    type({
                        password: 'string',
                    }),
                ),
                async (c) => {
                    const galleryId = Number(c.req.param('galleryId'));
                    const { password } = c.req.valid('form');
                    const token = await this.login(galleryId, password);
                    if (!token) {
                        throw new BadRequestError('Code secret invalide');
                    }
                    return c.json({ token });
                },
            )
            .get(
                '/:galleryId/export',
                authManager.authMiddleware(AuthRole.ADMIN),
                async (c) => {
                    const galleryId = Number(c.req.param('galleryId'));
                    const result = await this.export(galleryId);
                    if (!result) {
                        throw new NotFoundError(
                            `Gallery ${galleryId} not found or has no images`,
                        );
                    }
                    const { gallery, blob } = result;
                    if (!blob) {
                        throw new NotFoundError(
                            `Gallery ${galleryId} not found or has no images`,
                        );
                    }
                    c.header(
                        'Content-Disposition',
                        `attachment; filename="${gallery.name}.zip"`,
                    );
                    c.header('Content-Type', 'application/zip');
                    // Convertir Blob en Buffer
                    const buffer = await blob.arrayBuffer();
                    return c.body(buffer);
                },
            )
            .post(
                '/:galleryId/reorderAlbums',
                authManager.authMiddleware(AuthRole.ADMIN),
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
                    const galleryId = Number(c.req.param('galleryId'));
                    const { albumOrders } = c.req.valid('json');
                    await this.reorderAlbums(galleryId, albumOrders);
                    return c.json({ message: 'Albums reordered' });
                },
            )
            .post(
                '/:galleryId/addAlbum',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        code: 'string',
                        name: 'string',
                    }),
                ),
                async (c) => {
                    const formData = c.req.valid('form');
                    const galleryId = Number(c.req.param('galleryId'));

                    const newAlbum = await this.addAlbum(galleryId, formData);
                    return c.json({ message: 'Album added', item: newAlbum });
                },
            )
            .patch(
                '/album/:albumId',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        code: 'string',
                        name: 'string',
                        'orderIndex?': 'number',
                    }),
                ),
                async (c) => {
                    const formData = c.req.valid('form');
                    const albumId = Number(c.req.param('albumId'));
                    const updatedAlbum = await this.updateAlbum(
                        albumId,
                        formData,
                    );
                    if (!updatedAlbum) {
                        throw new NotFoundError(`Album ${albumId} not found`);
                    }
                    return c.json({
                        message: 'Album updated',
                        item: updatedAlbum,
                    });
                },
            )
            .delete(
                '/album/:albumId',
                authManager.authMiddleware(AuthRole.ADMIN),
                async (c) => {
                    const albumId = Number(c.req.param('albumId'));
                    const success = await this.deleteAlbum(albumId);
                    if (!success) {
                        throw new NotFoundError(`Album ${albumId} not found`);
                    }
                    return c.json({ message: 'Album deleted' });
                },
            )
            .get('/image/:imageId', async (c) => {
                const imageId = Number(c.req.param('imageId'));
                const image = await this.imageRepo.findOne({
                    where: { id: imageId },
                    relations: ['album', 'album.gallery'],
                });
                if (!image) {
                    throw new NotFoundError(
                        `Thumbnail for image ${imageId} not found`,
                    );
                }
                const thumbnail = await readFile(image.path!(true));
                c.header('Content-Type', 'image/jpeg');
                c.header(
                    'Cache-Control',
                    'public, max-age=31536000, immutable',
                );
                return c.body(new Uint8Array(thumbnail));
            })
            .post(
                '/album/:albumId/addImages',
                authManager.authMiddleware(AuthRole.ADMIN),
                arktypeValidator(
                    'form',
                    type({
                        // Accepter soit un seul File soit un tableau de File
                        files: 'File | File[]',
                    }),
                ),
                async (c) => {
                    const albumId = Number(c.req.param('albumId'));
                    const { files } = c.req.valid('form') as {
                        files: File | File[];
                    };
                    const fileArray = Array.isArray(files) ? files : [files];
                    if (!fileArray || fileArray.length === 0) {
                        throw new BadRequestError('Aucun fichier fourni');
                    }
                    await this.addImages(albumId, fileArray);
                    return c.json({ message: 'Images added' });
                },
            )
            .delete(
                '/image/:imageId',
                authManager.authMiddleware(AuthRole.ADMIN),
                async (c) => {
                    const imageId = Number(c.req.param('imageId'));
                    const success = await this.deleteImage(imageId);
                    if (!success) {
                        throw new NotFoundError(`Image ${imageId} not found`);
                    }
                    return c.json({ message: 'Image deleted' });
                },
            );
    }
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

// Types and Schemas
@Entity('galleries')
export class Gallery extends EntityWithDefaultColumns {
    @Column('text', { nullable: false })
    name: string = '';

    @Column('text', { nullable: false })
    description: string = '';

    @Column('text', { nullable: false })
    status: EntityStatus = EntityStatus.DRAFT;

    @Column('text', { nullable: true })
    password?: string;

    @OneToMany(() => Album, (album) => album.gallery, {
        eager: true,
        onDelete: 'CASCADE',
    })
    albums?: Album[];

    // ---
    isProtected?: boolean = false;
    @AfterLoad()
    updateIsProtected? = () => {
        this.isProtected = !!this.password;
    };

    path? = () => {
        return path.join(GALLERY_DIR, this.id.toString());
    };

    pathCover? = () => {
        return path.join(GALLERY_DIR, this.id.toString(), 'cover.png');
    };
}

@Entity('galleries_albums')
export class Album extends EntityWithDefaultColumns {
    @ManyToOne(() => Gallery, (gallery) => gallery.albums, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'galleryId' })
    gallery: Gallery = new Gallery();

    @Column('int', { nullable: false })
    orderIndex: number = 0;

    @Column('text', { nullable: false })
    code: string = '';

    @Column('text', { nullable: false })
    name: string = '';

    @OneToMany(() => Image, (image) => image.album, { eager: true })
    images?: Image[];

    // ---
    path? = () => {
        return path.join(
            GALLERY_DIR,
            this.gallery.id.toString(),
            this.id.toString(),
        );
    };
}

@Entity('galleries_albums_images')
export class Image extends EntityWithDefaultColumns {
    @ManyToOne(() => Album, (album) => album.images)
    @JoinColumn({ name: 'albumId' })
    album: Album = new Album();

    @Column('text', { nullable: false })
    code: string = '';

    @Column('text', { nullable: false })
    filename: string = '';

    @Column('float', { nullable: false })
    ratio: number = 1.0;

    // ---
    fullcode!: string;
    @AfterLoad()
    updateFullcode() {
        this.fullcode = this.album?.code
            ? `${this.album.code}${this.code}`
            : this.code;
    }

    path? = (thumbnail: boolean = false) => {
        return path.join(
            GALLERY_DIR,
            this.album.gallery.id.toString(),
            this.album.id.toString(),
            thumbnail ? THUMBNAIL_DIR : '',
            this.filename,
        );
    };
}

const GalleryAddSchema = type({
    name: 'string',
    description: 'string',
    status: type.valueOf(EntityStatus),
    password: 'string | undefined',
});

const GalleryEditSchema = type({
    name: 'string',
    description: 'string',
    status: type.valueOf(EntityStatus),
    password: 'string | undefined',
});
