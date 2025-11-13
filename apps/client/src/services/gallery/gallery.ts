import { Album, Gallery, Image } from '@server/gallery/gallery.types';

import { callRpc } from '@/utils/rpc';

import { authService } from '../auth';
import { serverApi } from '../server';

export class GalleryService {
    headers(galleryId: number): Record<string, string> {
        const token = localStorage.getItem(`gallery_${galleryId}_token`);
        return token ? { 'X-Gallery-Token': `${token}` } : {};
    }

    all = async (fromAdmin?: boolean): Promise<Gallery[]> => {
        const data = await callRpc(
            serverApi.gallery.all.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return data.map((gallery: any) => this.transformGallery(gallery));
    };

    get = async (galleryId: number, fromAdmin?: boolean): Promise<Gallery> => {
        const data = await callRpc(
            serverApi.gallery[':galleryId'].$get(
                {
                    param: { galleryId: galleryId.toString() },
                },
                {
                    headers: fromAdmin
                        ? authService.headers()
                        : this.headers(galleryId),
                },
            ),
        );
        return this.transformGallery(data);
    };

    add = async (gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>) => {
        await callRpc(
            serverApi.gallery.add.$post(
                {
                    form: gallery,
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    delete = async (id: number) => {
        await callRpc(
            serverApi.gallery.delete[':id'].$delete(
                { param: { id: String(id) } },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    update = async (gallery: Gallery): Promise<void> => {
        await callRpc(
            serverApi.gallery.update.$post(
                {
                    form: {
                        id: gallery.id.toString(),
                        name: gallery.name,
                        description: gallery.description,
                        status: gallery.status,
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    login = async (
        galleryId: number,
        password: string,
    ): Promise<string | void> => {
        const data = await callRpc(
            serverApi.gallery.login.$post({
                form: { galleryId: galleryId.toString(), password },
            }),
        );
        if (data.token) {
            localStorage.setItem(`gallery_${galleryId}_token`, data.token);
            return data.token;
        }
        return;
    };
    updatePassword = async (
        galleryId: number,
        password?: string,
    ): Promise<void> => {
        await callRpc(
            serverApi.gallery.updatePassword.$post(
                {
                    form: {
                        galleryId: galleryId.toString(),
                        password: password || '',
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };
    album = async (
        galleryId: number,
        albumId: number,
        fromAdmin?: boolean,
    ): Promise<Album> => {
        const data = await callRpc(
            serverApi.gallery.album[':albumId'].$get(
                {
                    param: { albumId: albumId.toString() },
                },
                {
                    headers: fromAdmin
                        ? authService.headers()
                        : this.headers(galleryId),
                },
            ),
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

    image = async (
        galleryId: number,
        fromAdmin: boolean | undefined,
        imageId: number,
        updatedAt?: string,
    ): Promise<string> => {
        let url = `/api/gallery/image/${imageId}/thumbnail`;
        if (updatedAt) {
            // Ajouter un query parameter pour invalider le cache lors d'une mise à jour
            const timestamp = new Date(updatedAt).getTime();
            url += `?v=${timestamp}`;
        }

        const response = await fetch(url, {
            headers: fromAdmin
                ? authService.headers()
                : this.headers(galleryId),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch thumbnail: ${response.statusText}`,
            );
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    };

    cover = async (
        galleryId: number,
        updatedAt?: string,
    ): Promise<string | undefined> => {
        let url = `/api/gallery/cover/${galleryId}`;
        if (updatedAt) {
            // Ajouter un query parameter pour invalider le cache lors d'une mise à jour
            const timestamp = new Date(updatedAt).getTime();
            url += `?v=${timestamp}`;
        }

        const response = await fetch(url);
        if (!response || !response.ok) {
            throw new Error(`Failed to fetch cover: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
            return undefined;
        }
        return URL.createObjectURL(blob);
    };

    updateCover = async (galleryId: number, file?: File): Promise<string> => {
        const formData = new FormData();
        formData.append('galleryId', galleryId.toString());
        if (file) formData.append('file', file);

        const headers = authService.headers();
        delete (headers as any)['Content-Type'];

        const response = await fetch('/api/gallery/updateCover', {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    };

    addImages = async (albumId: number, files: File[]) => {
        const formData = new FormData();
        formData.append('albumId', albumId.toString());
        files.forEach((file) => {
            formData.append('files', file);
        });

        const headers = authService.headers();
        delete (headers as any)['Content-Type'];

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
    };

    export = async (galleryId: number): Promise<Blob> => {
        const headers = authService.headers();
        delete (headers as any)['Content-Type'];

        const response = await fetch(`/api/gallery/export/${galleryId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.message || "Échec de l'exportation de la galerie",
            );
        }

        return response.blob();
    };

    // Convertir Uint8Array en Blob
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
