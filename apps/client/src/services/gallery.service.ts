/* eslint-disable react-hooks/rules-of-hooks */
import { Gallery, Image } from '@server/modules/shared.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { authService } from './auth.service';
import { BaseService } from './base.service';
import { serverApi } from './server';

class GalleryService extends BaseService {
    constructor() {
        super();
    }

    getHeaders = (fromAdmin?: boolean, galleryId?: number) => {
        let headers = {};
        if (fromAdmin) {
            headers = authService.headers();
        } else if (galleryId !== undefined) {
            const token = localStorage.getItem(`gallery_${galleryId}_token`);
            headers = token ? { 'X-Gallery-Token': `${token}` } : {};
        }
        return {
            headers,
        };
    };

    // Galerie
    useAll = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetHook(
            serverApi.gallery.all,
            (res) => res.galleries,
            fromAdmin,
            deps,
        );

    useLatest = (fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetHook(
            serverApi.gallery.latest,
            (res) => res.gallery,
            fromAdmin,
            deps,
        );

    useGet = (id: number, fromAdmin?: boolean, deps?: React.DependencyList) =>
        this.createGetByIdHook(
            serverApi.gallery[':id'],
            (res) => res.gallery,
            id,
            fromAdmin,
            deps,
        );

    useCover = (gallery: Gallery) =>
        usePromise(
            () => this.cover(gallery.id, gallery.updatedAt),
            [gallery.id, gallery.updatedAt],
        );

    useExport = () =>
        usePromiseFunc((galleryId: number) => this.export(galleryId));

    useUpdateCover = (galleryId: number) =>
        usePromiseFunc((files?: File[]) =>
            this.updateCover(galleryId, files?.[0]),
        );

    useAdd = () => this.createPostHook(serverApi.gallery.add);

    useEdit = () => this.createPatchHook(serverApi.gallery[':id']);

    useDelete = () => this.createDeleteHook(serverApi.gallery[':id']);

    useUpdatePassword = () =>
        this.createPatchHook(serverApi.gallery[':id'].updatePassword);

    useLogin = (galleryId: number) =>
        usePromiseFunc((password: string) =>
            galleryService.login(galleryId, password),
        );

    // Album
    useReorderAlbums = (galleryId: number) =>
        usePromiseFunc(
            (data: {
                albumOrders: Array<{ albumId: number; orderIndex: number }>;
            }) => this.reorderAlbums(galleryId, data.albumOrders),
        );

    private reorderAlbums = async (
        galleryId: number,
        albumOrders: Array<{ albumId: number; orderIndex: number }>,
    ): Promise<void> => {
        const response = await fetch(
            `/api/gallery/${galleryId}/reorderAlbums`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.headers(),
                },
                body: JSON.stringify({ albumOrders }),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reorder albums');
        }
    };

    useAddAlbum = (galleryId: number) =>
        this.createPostHookWithId(serverApi.gallery[':id'].addAlbum, galleryId);

    useEditAlbum = (albumId: number) =>
        this.createPatchHookWithId(serverApi.gallery.album[':id'], albumId);

    useDeleteAlbum = () =>
        this.createDeleteHook(serverApi.gallery.album[':id']);

    // Image
    useImage = (
        galleryId: number,
        image: Image | null | undefined,
        fromAdmin?: boolean,
    ) =>
        usePromise(
            () =>
                image
                    ? galleryService.image(
                          galleryId,
                          fromAdmin,
                          image.id,
                          image.updatedAt,
                      )
                    : Promise.resolve(undefined),
            [image?.id, image?.updatedAt],
        );

    useAddImages = (albumId: number) =>
        usePromiseFunc((files: File[]) => this.addImages(albumId, files));

    useDeleteImage = () =>
        this.createDeleteHook(serverApi.gallery.image[':id']);

    // ---
    login = async (
        galleryId: number,
        password: string,
    ): Promise<string | void> => {
        const data = await callRpc(
            serverApi.gallery[':id'].login.$post({
                param: { id: galleryId.toString() },
                form: { password },
            }),
        );
        if (data.token) {
            localStorage.setItem(`gallery_${galleryId}_token`, data.token);
            return data.token;
        }
        return;
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

        const response = await fetch(
            url,
            this.getHeaders(fromAdmin, galleryId),
        );

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
}

export const galleryService = new GalleryService();
