import { Image } from '@server/gallery/gallery.types';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { galleryService } from './gallery';

export const useGallery = (
    galleryId?: number,
    fromAdmin?: boolean,
    deps?: React.DependencyList,
) =>
    usePromise(
        () =>
            galleryId
                ? galleryService.get(galleryId, fromAdmin)
                : Promise.resolve(null),
        [galleryId, ...(deps || [])],
    );

export const useGalleryImage = (
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
                      image.updatedAt.toISOString(),
                  )
                : Promise.resolve(undefined),
        [image?.id, image?.updatedAt.toISOString()],
    );

export const useGalleryAddAlbum = (galleryId: number) =>
    usePromiseFunc((name: string) => galleryService.addAlbum(galleryId, name));

export const useGalleryDeleteAlbum = () =>
    usePromiseFunc((albumId: number) => galleryService.deleteAlbum(albumId));

export const useGalleryDeleteImage = () =>
    usePromiseFunc((imageId: number) => galleryService.deleteImage(imageId));

export const useGalleryAddImages = (albumId: number) =>
    usePromiseFunc((files: File[]) => galleryService.addImages(albumId, files));

export const useGalleryUpdatePassword = (galleryId: number) =>
    usePromiseFunc((password?: string) =>
        galleryService.updatePassword(galleryId, password),
    );

export const useGalleryLogin = (galleryId: number) =>
    usePromiseFunc((password: string) =>
        galleryService.login(galleryId, password),
    );
