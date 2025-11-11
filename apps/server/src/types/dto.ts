/**
 * DTOs (Data Transfer Objects)
 * Sépare la structure DB de la structure API
 * Permet de transformer les données sans exposer les détails internes
 */

// ===== Action DTOs =====
export interface ActionDTO {
    id: number;
    name: string;
    description: string;
    type: string;
    status: string;
    galleryId?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateActionDTO {
    name: string;
    description: string;
    type: string;
    status: string;
}

// ===== Auth DTOs =====
export interface UserDTO {
    id: number;
    username: string;
    role: string;
}

export interface LoginDTO {
    accessToken: string;
    refreshToken: string;
    user: UserDTO;
}

// ===== Gallery DTOs =====
export interface GalleryDTO {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AlbumDTO {
    id: number;
    name: string;
    galleryId: number;
}

export interface ImageDTO {
    id: number;
    filename: string;
    ratio: number;
    code: string;
    albumId: number;
}

// ===== Blog DTOs =====
export interface BlogDTO {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBlogDTO {
    title: string;
    content: string;
    author: string;
}
