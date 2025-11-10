import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { galleryService } from './gallery';

export const useGallery = (galleryId?: number, deps?: React.DependencyList) =>
    usePromise(
        () =>
            galleryId ? galleryService.get(galleryId) : Promise.resolve(null),
        [galleryId, ...(deps || [])],
    );

export const useGalleryImage = (imageId: number) =>
    usePromise(() => galleryService.image(imageId));

export const useGalleryAddAlbum = (galleryId: number) =>
    usePromiseFunc((name: string) => galleryService.addAlbum(galleryId, name));

export const useGalleryDeleteAlbum = () =>
    usePromiseFunc((albumId: number) => galleryService.deleteAlbum(albumId));

export const useGalleryDeleteImage = () =>
    usePromiseFunc((imageId: number) => galleryService.deleteImage(imageId));

export const useGalleryAddImages = (albumId: number) =>
    usePromiseFunc((files: File[]) => galleryService.addImages(albumId, files));
