import { Gallery } from '@server/gallery/gallery.types';

import { callRpc } from '@/utils/rpc';

import { serverApi } from '../server';

export class GalleryService {
    gallery = async (galleryName: string): Promise<Gallery> => {
        return await callRpc(
            serverApi.gallery[':galleryName'].$get({ param: { galleryName } }),
        );
    };
    all = async (): Promise<Gallery[]> => {
        return await callRpc(serverApi.gallery.all.$get());
    };
    image = async (galleryName: string, filename: string): Promise<string> => {
        const response = await callRpc(
            serverApi.gallery[':galleryName'][':filename'].$get({
                param: { galleryName, filename },
            }),
        );
        const blob = this.uint8ArrayToBlob(response);
        const url = URL.createObjectURL(blob);
        return url;
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
}

export const galleryService = new GalleryService();
