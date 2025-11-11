/**
 * Mappers - Transforme les objets DB en DTOs et vice-versa
 * Centralize la logique de transformation
 */
import {
    ActionDTO,
    AlbumDTO,
    BlogDTO,
    GalleryDTO,
    ImageDTO,
    UserDTO,
} from './dto';

export class Mappers {
    static userToDTO(user: any): UserDTO {
        return {
            id: user.id,
            username: user.username,
            role: user.role,
        };
    }

    static actionToDTO(action: any): ActionDTO {
        return {
            id: action.id,
            name: action.name,
            description: action.description,
            type: action.type,
            status: action.status,
            galleryId: action.galleryId,
            createdAt: new Date(action.createdAt),
            updatedAt: new Date(action.updatedAt),
        };
    }

    static galleryToDTO(gallery: any): GalleryDTO {
        return {
            id: gallery.id,
            name: gallery.name,
            createdAt: new Date(gallery.createdAt),
            updatedAt: new Date(gallery.updatedAt),
        };
    }

    static albumToDTO(album: any): AlbumDTO {
        return {
            id: album.id,
            name: album.name,
            galleryId: album.galleryId,
        };
    }

    static imageToDTO(image: any): ImageDTO {
        return {
            id: image.id,
            filename: image.filename,
            ratio: image.ratio,
            code: image.code,
            albumId: image.albumId,
        };
    }

    static blogToDTO(blog: any): BlogDTO {
        return {
            id: blog.id,
            title: blog.title,
            content: blog.content,
            author: blog.author,
            createdAt: new Date(blog.createdAt),
            updatedAt: new Date(blog.updatedAt),
        };
    }
}
