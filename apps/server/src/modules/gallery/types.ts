import path from 'path';
import {
    AfterLoad,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { DATA_FILE_PATH } from '@server/tools/env';

import { EntityWithDefaultColumns } from '../base.module';
import { EntityStatus } from '../shared.types';

const GALLERY_DIR = path.resolve(DATA_FILE_PATH, 'gallery');
const THUMBNAIL_DIR = 'thumbnails';

@Entity('galleries')
export class Gallery implements EntityWithDefaultColumns {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();

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

    toDTO = () => {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            isProtected: !!this.password,
            albums: this.albums
                ?.map((album) => album.toDTO())
                .sort((a, b) => a.orderIndex - b.orderIndex),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    };
}

@Entity('galleries_albums')
export class Album implements EntityWithDefaultColumns {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();

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

    toDTO = () => {
        return {
            id: this.id,
            code: this.code,
            name: this.name,
            orderIndex: this.orderIndex,
            galleryId: this.gallery.id,
            images: this.images?.map((image) => image.toDTO()),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    };
}

@Entity('galleries_albums_images')
export class Image implements EntityWithDefaultColumns {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('datetime', { nullable: false })
    createdAt: Date = new Date();

    @Column('datetime', { nullable: false })
    updatedAt: Date = new Date();

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

    toDTO = () => {
        return {
            id: this.id,
            code: this.code,
            filename: this.filename,
            ratio: this.ratio,
            albumId: this.album.id,
            fullcode: `${this.album.code}${this.code}`,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    };
}
