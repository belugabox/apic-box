import { useNavigate, useParams } from 'react-router';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { Spinner } from '@/components/Spinner';
import { useGallery } from '@/services/gallery';

import { GalleryLogin } from './Login';

export const Gallery = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string }>();

    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    const galleryId = parseInt(params.galleryId, 10);

    const [gallery, loading, error] = useGallery(galleryId);
    if (loading) return <Spinner />;
    if (error?.name === 'UnauthorizedError') {
        return <GalleryLogin galleryId={galleryId} />;
    }
    if (error) return <ErrorMessage error={error} />;
    if (!gallery) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
    if (gallery?.albums.length === 0) {
        return (
            <EmptyState
                icon="photo_album"
                title={`La galerie ${gallery?.name} est vide`}
            />
        );
    }

    return (
        <div className="grid">
            {gallery?.albums.map((album) => (
                <AlbumCard className="s12 m6 l3" key={album.name} album={album}>
                    <button
                        onClick={() =>
                            navigate(`/gallery/${galleryId}/${album.id}`)
                        }
                    >
                        Voir l'album
                    </button>
                </AlbumCard>
            ))}
        </div>
    );
};
