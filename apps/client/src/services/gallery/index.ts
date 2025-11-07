import { usePromise } from '@/utils/Hooks';

import { galleryService } from './gallery';

export const useGallery = (galleryName: string) =>
    usePromise(() => galleryService.gallery(galleryName), [galleryName]);

export const useGalleries = () => usePromise(() => galleryService.all());

export const useGalleryImage = (galleryName: string, filename: string) =>
    usePromise(() => galleryService.image(galleryName, filename));
