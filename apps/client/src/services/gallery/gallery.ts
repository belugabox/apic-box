import type { Album, Gallery, Image } from '@shared';

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
        return data.map((gallery) => this.transformGallery(gallery));
    };

    latest = async (fromAdmin?: boolean): Promise<Gallery | null> => {
        const data = await callRpc(
            serverApi.gallery.latest.$get(
                {},
                {
                    headers: fromAdmin ? authService.headers() : {},
                },
            ),
        );
        return this.transformGallery(data);
    };

    get = async (galleryId: number, fromAdmin?: boolean): Promise<Gallery> => {
        const data = await callRpc(
            serverApi.gallery[':id'].$get(
                {
                    param: { id: galleryId.toString() },
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

    add = async (
        gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt' | 'toDTO'>,
    ) => {
        await callRpc(
            serverApi.gallery.add.$post(
                {
                    form: {
                        name: gallery.name,
                        status: gallery.status,
                        description: gallery.description,
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    delete = async (id: number) => {
        await callRpc(
            serverApi.gallery[':id'].$delete(
                { param: { id: id.toString() } },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    update = async (gallery: Gallery): Promise<void> => {
        await callRpc(
            serverApi.gallery[':id'].$patch(
                {
                    param: { id: gallery.id.toString() },
                    form: {
                        name: gallery.name,
                        status: gallery.status,
                        description: gallery.description,
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
            serverApi.gallery[':galleryId'].login.$post({
                param: { galleryId: galleryId.toString() },
                form: { password },
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
            serverApi.gallery[':galleryId'].updatePassword.$post(
                {
                    param: { galleryId: galleryId.toString() },
                    form: {
                        password: password || '',
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    addAlbum = async (
        galleryId: number,
        name: string,
        code: string,
    ): Promise<void> => {
        await callRpc(
            serverApi.gallery[':galleryId'].addAlbum.$post(
                {
                    param: { galleryId: galleryId.toString() },
                    form: { name, code },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };
    updateAlbum = async (
        albumId: number,
        name: string,
        code: string,
    ): Promise<void> => {
        await callRpc(
            serverApi.gallery.album[':albumId'].$patch(
                {
                    param: { albumId: albumId.toString() },
                    form: {
                        name,
                        code,
                    },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    deleteAlbum = async (albumId: number): Promise<void> => {
        await callRpc(
            serverApi.gallery.album[':albumId'].$delete(
                {
                    param: { albumId: albumId.toString() },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    reorderAlbums = async (
        galleryId: number,
        albumOrders: Array<{ albumId: number; orderIndex: number }>,
    ): Promise<void> => {
        await callRpc(
            serverApi.gallery[':galleryId'].reorderAlbums.$post(
                {
                    param: { galleryId: galleryId.toString() },
                    json: { albumOrders },
                },
                {
                    headers: authService.headers(),
                },
            ),
        );
    };

    deleteImage = async (imageId: number): Promise<void> => {
        await callRpc(
            serverApi.gallery.image[':imageId'].$delete(
                {
                    param: { imageId: imageId.toString() },
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
        let url = `/api/gallery/image/${imageId}`;
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
        let url = `/api/gallery/${galleryId}/cover`;
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
        if (file) formData.append('file', file);

        const headers = authService.headers();
        delete headers['Content-Type'];

        const response = await fetch(`/api/gallery/${galleryId}/updateCover`, {
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
        files.forEach((file) => {
            formData.append('files', file);
        });

        const headers = authService.headers();
        delete headers['Content-Type'];

        const response = await fetch(
            `/api/gallery/album/${albumId}/addImages`,
            {
                method: 'POST',
                body: formData,
                headers,
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    };

    export = async (galleryId: number): Promise<Blob> => {
        const headers = authService.headers();
        delete headers['Content-Type'];

        const response = await fetch(`/api/gallery/${galleryId}/export`, {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformImage = (image: any): Image => ({
        ...image,
        createdAt: new Date(image.createdAt),
        updatedAt: new Date(image.updatedAt),
        album: image.album ? this.transformAlbum(image.album) : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformAlbum = (album: any): Album => ({
        ...album,
        createdAt: new Date(album.createdAt),
        updatedAt: new Date(album.updatedAt),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: album.images?.map((img: any) => this.transformImage(img)),
        gallery: album.gallery
            ? this.transformGallery(album.gallery)
            : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformGallery = (gallery: any): Gallery => ({
        ...gallery,
        createdAt: new Date(gallery.createdAt),
        updatedAt: new Date(gallery.updatedAt),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        albums: gallery.albums?.map((album: any) => this.transformAlbum(album)),
    });
}

export const galleryService = new GalleryService();
