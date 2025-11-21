import type { Gallery, Image } from '@shared';

import { usePromise, usePromiseFunc } from '@/utils/Hooks';

import { galleryService } from './gallery';

export const useGalleries = (
    fromAdmin?: boolean,
    deps?: React.DependencyList,
) => usePromise(() => galleryService.all(fromAdmin), [...(deps || [])]);

export const useLatestGallery = (fromAdmin?: boolean) =>
    usePromise(() => galleryService.latest(fromAdmin), []);

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
                      image.updatedAt,
                  )
                : Promise.resolve(undefined),
        [image?.id, image?.updatedAt],
    );

export const useGalleryAdd = () =>
    usePromiseFunc((gallery: Gallery) => galleryService.add(gallery));

export const useGalleryUpdate = () =>
    usePromiseFunc((gallery: Gallery) => galleryService.update(gallery));

export const useGalleryCover = (gallery: Gallery) =>
    usePromise(
        () => galleryService.cover(gallery.id, gallery.updatedAt),
        [gallery.id, gallery.updatedAt],
    );

export const useGalleryExport = () =>
    usePromiseFunc((galleryId: number) => galleryService.export(galleryId));

export const useGalleryUpdateCover = (galleryId: number) =>
    usePromiseFunc((files?: File[]) =>
        galleryService.updateCover(galleryId, files?.[0]),
    );

export const useGalleryDelete = () =>
    usePromiseFunc((gallery: Gallery) => galleryService.delete(gallery.id));

export const useGalleryAddAlbum = (galleryId: number) =>
    usePromiseFunc((name: string, code: string) =>
        galleryService.addAlbum(galleryId, name, code),
    );

export const useGalleryUpdateAlbum = (albumId: number) =>
    usePromiseFunc((name: string, code: string) =>
        galleryService.updateAlbum(albumId, name, code),
    );

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
