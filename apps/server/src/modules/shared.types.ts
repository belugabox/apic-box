import { ServerType as ServerTypeDef } from '../main';
import type { User as UserORM } from './auth/types';
import type { Blog as BlogORM } from './blog';
import type {
    Album as AlbumORM,
    Gallery as GalleryORM,
    Image as ImageORM,
} from './gallery';

export enum EntityStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

export type ServerType = ServerTypeDef;

export type User = ReturnType<typeof UserORM.prototype.toDTO>;

export type Blog = ReturnType<typeof BlogORM.prototype.toDTO>;

export type Gallery = ReturnType<typeof GalleryORM.prototype.toDTO>;
export type Album = ReturnType<typeof AlbumORM.prototype.toDTO>;
export type Image = ReturnType<typeof ImageORM.prototype.toDTO>;
