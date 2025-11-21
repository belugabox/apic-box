import type { Image } from '@shared';

import { useGalleryDeleteImage } from '@/services/gallery';

interface AdminGalleryImageDeleteProps {
    image?: Image;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminGalleryImageDelete = ({
    image,
    onClose,
    onSuccess,
}: AdminGalleryImageDeleteProps) => {
    const [deleteImage, loading, error] = useGalleryDeleteImage();

    const handleConfirmDelete = async () => {
        try {
            if (image) {
                await deleteImage(image.id);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    return (
        <div>
            <h5>Confirmer la suppression</h5>
            <p>
                Êtes-vous sûr de vouloir supprimer l'image{' '}
                <strong>"{image?.fullcode}"</strong> ?
            </p>
            <span className="error-text">{error?.message}</span>
            <nav className="right-align">
                <button className="border" onClick={onClose}>
                    Annuler
                </button>
                <button
                    className="error"
                    disabled={loading}
                    onClick={handleConfirmDelete}
                >
                    Supprimer
                </button>
            </nav>
        </div>
    );
};
