/* eslint-disable react-hooks/rules-of-hooks */
import { Gallery, Image } from '@server/modules/shared.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';
import { BlobURLCache } from '@/utils/cache';
import {
    buildUrlWithTimestamp,
    callRpc,
    fetch as fetchApi,
    fetchBlobWithCache,
} from '@/utils/rpc';

import { authService } from './auth.service';
import { BaseService } from './base.service';
import { serverApi } from './server';

class GalleryService extends BaseService {
    private imageCache = new BlobURLCache(200);
    private coverCache = new BlobURLCache(200);

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

    private getAuthHeaders = (): Record<string, string> => {
        const headers = { ...authService.headers() };
        delete headers['Content-Type'];
        return headers;
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
        await fetchApi(`/api/gallery/${galleryId}/reorderAlbums`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
            body: JSON.stringify({ albumOrders }),
        });
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
            (signal) =>
                image
                    ? galleryService.image(
                          galleryId,
                          fromAdmin,
                          image.id,
                          image.updatedAt,
                          signal,
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
    };

    image = async (
        galleryId: number,
        fromAdmin: boolean | undefined,
        imageId: number,
        updatedAt?: string,
        signal?: AbortSignal,
    ): Promise<string> => {
        const cacheKey = `img_${imageId}_${updatedAt || '0'}`;
        const url = buildUrlWithTimestamp(
            `/api/gallery/image/${imageId}`,
            updatedAt,
        );

        const result = await fetchBlobWithCache(
            url,
            this.imageCache,
            cacheKey,
            {
                signal,
                ...this.getHeaders(fromAdmin, galleryId),
            },
            true,
        );

        if (!result) {
            throw new Error('Failed to load image');
        }
        return result;
    };

    cover = async (
        galleryId: number,
        updatedAt?: string,
    ): Promise<string | undefined> => {
        const cacheKey = `cover_${galleryId}_${updatedAt || '0'}`;
        const url = buildUrlWithTimestamp(
            `/api/gallery/${galleryId}/cover`,
            updatedAt,
        );

        return fetchBlobWithCache(url, this.coverCache, cacheKey);
    };

    export = async (galleryId: number): Promise<Blob> => {
        return fetchApi<Blob>(`/api/gallery/${galleryId}/export`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });
    };

    updateCover = async (galleryId: number, file?: File): Promise<string> => {
        const formData = new FormData();
        if (file) formData.append('file', file);

        return fetchApi<string>(`/api/gallery/${galleryId}/updateCover`, {
            method: 'POST',
            body: formData,
            headers: this.getAuthHeaders(),
        });
    };

    addImages = async (albumId: number, files: File[]) => {
        const BATCH_SIZE = 3;
        const headers = this.getAuthHeaders();

        // Process files in batches of 3
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const formData = new FormData();
            batch.forEach((file) => {
                formData.append('files', file);
            });

            await fetchApi(`/api/gallery/album/${albumId}/addImages`, {
                method: 'POST',
                body: formData,
                headers,
            });
        }

        return { message: 'All images added successfully' };
    };
}

export const galleryService = new GalleryService();
