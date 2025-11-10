import { useGalleryDeleteAlbum } from "@/services/gallery";
import { Album } from "@server/gallery/gallery.types";

interface AdminGalleryAlbumDeleteProps {
    album?: Album;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminGalleryAlbumDelete = ({ album, onClose, onSuccess }: AdminGalleryAlbumDeleteProps) => {

    const [deleteAlbum, loading, error] = useGalleryDeleteAlbum();

    const handleConfirmDelete = async () => {
        try {
            if (album) {
                await deleteAlbum(album.id);
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
            <p>Êtes-vous sûr de vouloir supprimer l'album <strong>"{album?.name}"</strong> ({album?.images.length} photos) ?</p>
            <span className="error-text">{error?.message}</span>
            <nav className="right-align">
                <button className="border" onClick={onClose}>
                    Annuler
                </button>
                <button className="error" disabled={loading} onClick={handleConfirmDelete}>
                    Supprimer
                </button>
            </nav>
        </div>
    );
};