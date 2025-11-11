import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useParams } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { ImageCard } from '@/components/ImageCard';
import { Spinner } from '@/components/Spinner';
import { useGallery } from '@/services/gallery';

export const Album = () => {
    const params = useParams<{ galleryId: string; albumId: string }>();

    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
    const galleryId = parseInt(params.galleryId, 10);
    const [gallery, loading, error] = useGallery(galleryId);
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    if (!gallery) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    if (!params.albumId) {
        return <EmptyState icon="photo_album" title={`L'album n'existe pas`} />;
    }
    const albumId = parseInt(params.albumId, 10);
    const album = gallery?.albums.find((a) => a.id === albumId);
    if (!album) {
        return <EmptyState icon="photo_album" title={`L'album n'existe pas`} />;
    }
    if (album.images.length === 0) {
        return (
            <EmptyState
                icon="photo_album"
                title={`L'album ${album.name} est vide`}
            />
        );
    }

    return (
        <div>
            <h5>{album.name}</h5>
            <ResponsiveMasonry
                columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
            >
                <Masonry>
                    {album.images.map((image) => (
                        <ImageCard
                            key={image.id}
                            galleryId={galleryId}
                            image={image}
                        >
                            {image.code}
                        </ImageCard>
                    ))}
                </Masonry>
            </ResponsiveMasonry>
        </div>
    );
};
