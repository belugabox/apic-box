import type { Gallery } from '@shared';

import { galleryService } from '@/services/gallery.service';

interface AdminGalleryDeleteProps {
    gallery?: Gallery;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminGalleryDelete = ({
    gallery,
    onClose,
    onSuccess,
}: AdminGalleryDeleteProps) => {
    const [deleteGallery, loading, error] = galleryService.useDelete();

    const handleConfirmDelete = async () => {
        try {
            if (gallery) {
                await deleteGallery(gallery.id);
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
                Êtes-vous sûr de vouloir supprimer la galerie{' '}
                <strong>"{gallery?.name}"</strong> ?
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
