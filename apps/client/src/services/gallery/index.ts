import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { galleryService } from './gallery';

export const useGallery = (galleryName?: string) =>
    usePromise(
        () =>
            galleryName
                ? galleryService.get(galleryName)
                : Promise.resolve(null),
        [galleryName],
    );

export const useGalleries = () => usePromise(() => galleryService.all());

export const useGalleryImage = (galleryName: string, filename: string) =>
    usePromise(() => galleryService.image(galleryName, filename));

export const useAddGalleryImages = (
    galleryName: string,
    albumName: string,
    files: File[],
) =>
    usePromiseFunc(() =>
        galleryService.addImages(galleryName, albumName, files),
    );
