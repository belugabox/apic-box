import { useNavigate, useParams } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { ImageCard } from '@/components/ImageCard';
import { Mansory2 } from '@/components/Mansonry';
import { Spinner } from '@/components/Spinner';
import { useGallery } from '@/services/gallery';

export const Album = () => {
    const navigate = useNavigate();
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

    return (
        <div>
            <nav className="row left-align top-align">
                <button
                    type="button"
                    className="circle transparent"
                    onClick={async () => {
                        navigate(-1);
                    }}
                >
                    <i>arrow_back</i>
                </button>

                <div>
                    <h5 className="no-margin inline-block large-margin-left">
                        {gallery.name} - {album.name}
                    </h5>
                    <p className="no-margin">{gallery.description}</p>
                </div>
            </nav>
            {album.images.length === 0 && (
                <EmptyState icon="photo_album" title={`L'album est vide`} />
            )}
            {album.images.length > 0 && (
                <Mansory2>
                    {album.images.map((image) => (
                        <ImageCard
                            key={image.id}
                            galleryId={galleryId}
                            image={image}
                            zoomable={true}
                        >
                            {image.code}
                        </ImageCard>
                    ))}
                </Mansory2>
            )}
            {/*import MasonryWrapper, { ResponsiveMasonry } from 'react-responsive-masonry';
            album.images.length > 0 && (
                <ResponsiveMasonry
                    className="top-margin"
                    columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
                >
                    <MasonryWrapper>
                        {album.images.map((image) => (
                            <ImageCard
                                key={image.id}
                                galleryId={galleryId}
                                image={image}
                                zoomable={true}
                            >
                                {image.code}
                            </ImageCard>
                        ))}
                    </MasonryWrapper>
                </ResponsiveMasonry>
            )*/}
        </div>
    );
};
