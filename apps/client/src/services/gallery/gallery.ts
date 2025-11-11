import { Album, Gallery, Image } from '@server/gallery/gallery.types';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class GalleryService {
    get = async (galleryId: number): Promise<Gallery> => {
        const data = await callRpc(
            serverApi.gallery[':galleryId'].$get({
                param: { galleryId: galleryId.toString() },
            }),
        );
        return this.transformGallery(data);
    };
    album = async (albumId: number): Promise<Album> => {
        const data = await callRpc(
            serverApi.gallery.album[':albumId'].$get({
                param: { albumId: albumId.toString() },
            }),
        );
        return this.transformAlbum(data);
    };
    addAlbum = async (galleryId: number, name: string): Promise<void> => {
        await callRpc(
            serverApi.gallery.addAlbum.$post(
                {
                    form: { galleryId: galleryId.toString(), name },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };
    deleteAlbum = async (albumId: number): Promise<void> => {
        await callRpc(
            serverApi.gallery.deleteAlbum.$post(
                {
                    form: { albumId: albumId.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };
    deleteImage = async (imageId: number): Promise<void> => {
        await callRpc(
            serverApi.gallery.deleteImage.$post(
                {
                    form: { imageId: imageId.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    image = async (imageId: number, updatedAt?: string): Promise<string> => {
        let url = `/api/gallery/image/${imageId}/thumbnail`;
        if (updatedAt) {
            // Ajouter un query parameter pour invalider le cache lors d'une mise à jour
            const timestamp = new Date(updatedAt).getTime();
            url += `?v=${timestamp}`;
        }

        const response = await fetch(url, {
            headers: authService.headers() || {},
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch thumbnail: ${response.statusText}`,
            );
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    };
    addImages = async (albumId: number, files: File[]) => {
        const formData = new FormData();
        formData.append('albumId', albumId.toString());
        files.forEach((file) => {
            formData.append('files', file);
        });

        // Logging correct pour FormData
        console.log('albumId:', albumId);
        console.log('files count:', files.length);
        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        // Utiliser fetch directement pour éviter les problèmes de sérialisation du client Hono
        const headers = authService.headers();
        delete (headers as any)['Content-Type']; // Laisser le navigateur ajouter le boundary

        const response = await fetch('/api/gallery/addImages', {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    }; // Convertir Uint8Array en Blob
    uint8ArrayToBlob = (uint8Array: Uint8Array): Blob => {
        const bytes = new Uint8Array(uint8Array);
        return new Blob([bytes], { type: 'image/jpeg' });
    };

    // Créer une URL d'objet pour affichage dans le DOM
    createImageUrl = (uint8Array: Uint8Array): string => {
        const blob = this.uint8ArrayToBlob(uint8Array);
        return URL.createObjectURL(blob);
    };

    // Convertir en data URL pour les données embeddées
    uint8ArrayToDataUrl = (uint8Array: Uint8Array): string => {
        const binary = String.fromCharCode(...uint8Array);
        return `data:image/jpeg;base64,${btoa(binary)}`;
    };

    private transformImage = (image: any): Image => ({
        ...image,
        createdAt: new Date(image.createdAt),
        updatedAt: new Date(image.updatedAt),
        album: image.album ? this.transformAlbum(image.album) : undefined,
    });

    private transformAlbum = (album: any): Album => ({
        ...album,
        createdAt: new Date(album.createdAt),
        updatedAt: new Date(album.updatedAt),
        images: album.images.map((img: any) => this.transformImage(img)),
        gallery: album.gallery
            ? this.transformGallery(album.gallery)
            : undefined,
    });

    private transformGallery = (gallery: any): Gallery => ({
        ...gallery,
        createdAt: new Date(gallery.createdAt),
        updatedAt: new Date(gallery.updatedAt),
        albums: gallery.albums.map((album: any) => this.transformAlbum(album)),
    });
}

export const galleryService = new GalleryService();
