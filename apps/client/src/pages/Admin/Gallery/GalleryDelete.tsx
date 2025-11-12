import { Gallery } from '@server/gallery/gallery.types';

import { useGalleryDelete } from '@/services/gallery';

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
    const [deleteGallery, loading, error] = useGalleryDelete();

    const handleConfirmDelete = async () => {
        try {
            if (gallery) {
                await deleteGallery(gallery);
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
