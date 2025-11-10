import { AlbumCard } from "@/components/AlbumCard";
import { EmptyState } from "@/components/EmptyState";
import { useGallery } from "@/services/gallery";
import { useNavigate, useParams } from "react-router";

export const Gallery = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string }>();

    if (!params.galleryId) {
        return <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />;
    }

    const galleryId = parseInt(params.galleryId, 10);

    const [gallery, _, error,] = useGallery(galleryId);

    if (!gallery) {
        return <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />;
    }
    if (gallery?.albums.length === 0) {
        return <EmptyState icon="photo_album" title={`La galerie ${gallery?.name} est vide`} />;
    }

    return (
        <div className="grid">
            {error && (<span className="error-text">{error?.message}</span>)}
            {gallery?.albums.map((album) => (
                <AlbumCard className="s12 m6 l3" key={album.name} album={album}>
                    <button onClick={() => navigate(`/gallery/${galleryId}/${album.id}`)}>Voir l'album</button>
                </AlbumCard>
            ))}
        </div>
    );
};
