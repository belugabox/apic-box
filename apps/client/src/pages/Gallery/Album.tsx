import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { ImageCard } from '@/components/ImageCard';
import { Mansory } from '@/components/Mansonry';
import { SubNavigation } from '@/components/SubNavigation';
import { useGallery } from '@/services/gallery';
import { useSpinner } from '@/services/spinner';

import { GalleryLogin } from './Login';

export const Album = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string; albumId: string }>();
    const [refresh, setRefresh] = useState(false);

    const galleryId = parseInt(params.galleryId || '', 10);
    const [gallery, loading, error] = useGallery(galleryId, false, [refresh]);
    useSpinner('Album', loading);
    if (loading) return;
    if (error?.name === 'UnauthorizedError') {
        return (
            <GalleryLogin
                galleryId={galleryId}
                onSuccess={() => setRefresh(!refresh)}
            />
        );
    }
    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
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

    /*const currentAlbumIndex = gallery.albums.findIndex((a) => a.id === albumId);
    const previousAlbum =
        currentAlbumIndex > 0 ? gallery.albums[currentAlbumIndex - 1] : null;
    const nextAlbum =
        currentAlbumIndex < gallery.albums.length - 1
            ? gallery.albums[currentAlbumIndex + 1]
            : null;*/

    return (
        <div>
            <SubNavigation
                onClickBack={() => navigate('/gallery/' + galleryId)}
            >
                {gallery.name} - {album.name}
            </SubNavigation>

            {/*
                <nav className="right-align tabbed small">
                    {previousAlbum && (
                        <Link to={`/gallery/${galleryId}/${previousAlbum.id}`}>
                            <i>arrow_back</i>
                        </Link>
                    )}
                    <Link
                        className="active"
                        to={`/gallery/${galleryId}/${album.id}`}
                    >
                        <span className="no-wrap">{album.name}</span>
                    </Link>
                    {nextAlbum && (
                        <Link to={`/gallery/${galleryId}/${nextAlbum.id}`}>
                            <i>arrow_forward</i>
                        </Link>
                    )}
                </nav>
                
                <nav className="max tabbed small m l">
                    {gallery.albums.map((a) => (
                        <Link
                            key={a.id}
                            className={`${album.id === a.id ? 'active' : ''}`}
                            to={`/gallery/${galleryId}/${a.id}`}
                        >
                            <span className="no-wrap">{a.name}</span>
                        </Link>
                    ))}
                </nav>
                <nav className="active">
                    <button className=" large fill">
                        <span className="no-wrap">{album.name}</span>
                    </button>
                    <menu className="bottom left right-align no-wrap">
                        {gallery.albums.map((a) => (
                            <li>
                                <Link
                                    key={a.id}
                                    className={`${album.id === a.id ? 'active' : ''}`}
                                    to={`/gallery/${galleryId}/${a.id}`}
                                >
                                    <span className="no-wrap">{a.name}</span>
                                </Link>
                            </li>
                        ))}
                    </menu>
                </nav>
                
                */}

            {album.images.length === 0 && (
                <EmptyState icon="no_photography" title={`L'album est vide`} />
            )}
            {album.images.length > 0 && (
                <Mansory>
                    {album.images.map((image) => (
                        <ImageCard
                            key={image.id}
                            galleryId={galleryId}
                            image={image}
                            zoomable={true}
                        >
                            {image.fullcode}
                        </ImageCard>
                    ))}
                </Mansory>
            )}
        </div>
    );
};
