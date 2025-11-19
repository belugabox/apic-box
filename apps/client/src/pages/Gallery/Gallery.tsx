import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { SubNavigation } from '@/components/SubNavigation';
import { useGallery } from '@/services/gallery';
import { useSpinner } from '@/services/spinner';

import { GalleryLogin } from './Login';

export const Gallery = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string }>();
    const [refresh, setRefresh] = useState(false);

    const galleryId = parseInt(params.galleryId || '', 10);

    const [gallery, loading, error] = useGallery(galleryId, false, [refresh]);
    useSpinner('Gallery', loading);
    if (loading) return;
    if (error?.message === 'NotFoundError' || !params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
    if (error?.message === 'UnauthorizedError') {
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
            <SubNavigation onClickBack={() => navigate('/gallery')}>
                {gallery.name}
            </SubNavigation>
            {gallery.albums.length === 0 && (
                <EmptyState
                    icon="photo_album"
                    title={`Aucun album pour le moment`}
                />
            )}
            <div className="grid">
                {gallery.albums.map((album) => (
                    <AlbumCard
                        className="s12 m6"
                        key={album.name}
                        galleryId={galleryId}
                        album={album}
                        onClick={() =>
                            navigate(`/gallery/${galleryId}/${album.id}`)
                        }
                    ></AlbumCard>
                ))}
            </div>
        </div>
    );
};
