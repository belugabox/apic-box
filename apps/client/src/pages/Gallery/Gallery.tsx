import { useState } from 'react';
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
    const [refresh, setRefresh] = useState(false);

    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    const galleryId = parseInt(params.galleryId, 10);

    const [gallery, loading, error] = useGallery(galleryId, false, [refresh]);
    if (loading) return <Spinner />;
    if (error?.name === 'UnauthorizedError') {
        return (
            <GalleryLogin
                galleryId={galleryId}
                onSuccess={() => setRefresh(!refresh)}
            />
        );
    }
    if (error) return <ErrorMessage error={error} />;
    if (!gallery) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    return (
        <div>
            <nav className="row left-align top-align">
                <button
                    type="button"
                    className="circle transparent"
                    onClick={async () => {
                        navigate('/gallery');
                    }}
                >
                    <i>arrow_back</i>
                </button>
                <div className="max">
                    <h5 className="no-margin inline-block large-margin-left">
                        {gallery.name}
                    </h5>
                    <p className="no-margin">
                        {gallery.description} - {gallery.albums.length} album
                        {gallery.albums.length > 1 ? 's' : ''}
                    </p>
                </div>
            </nav>
            {gallery.albums.length === 0 && (
                <EmptyState
                    icon="photo_album"
                    title={`Aucun album pour le moment`}
                />
            )}
            <div className="grid">
                {gallery.albums.map((album) => (
                    <AlbumCard
                        className="s12 m6 l4"
                        key={album.name}
                        album={album}
                    >
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
        </div>
    );
};
