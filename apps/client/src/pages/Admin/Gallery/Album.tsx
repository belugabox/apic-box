import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Image } from '@server/gallery/gallery.types';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { ImageCard } from '@/components/ImageCard';
import { Spinner } from '@/components/Spinner';
import { useGallery } from '@/services/gallery';

import { AdminGalleryImageDelete } from './ImageDelete';
import { AdminGalleryImagesButton } from './ImagesAdd';

export const AdminAlbum = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string; albumId: string }>();
    const [refresh, setRefresh] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<Image | null>(null);
    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
    const galleryId = parseInt(params.galleryId, 10);
    const [gallery, loading, error] = useGallery(galleryId, true, [refresh]);
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
            <div className="row left-align bottom-align ">
                <button
                    type="button"
                    className="circle transparent"
                    onClick={async () => {
                        navigate(-1);
                    }}
                >
                    <i>arrow_back</i>
                </button>
                <h4 className="no-margin inline-block large-margin-left">
                    {gallery.name} - {album.name}
                </h4>
                <p>
                    {album.images.length} photo
                    {album.images.length > 1 ? 's' : ''}
                </p>
            </div>
            <div className="grid">
                {album.images.map((image) => (
                    <ImageCard
                        className="s6 m4 l2"
                        key={image.id}
                        galleryId={galleryId}
                        fromAdmin={true}
                        image={image}
                    >
                        <div className="max">{image.code}</div>
                        <button
                            type="button"
                            className="circle small transparent"
                            onClick={() => setImageToDelete(image)}
                        >
                            <i>delete</i>
                        </button>
                    </ImageCard>
                ))}
            </div>
            <div className="medium-space"></div>
            {/* Modal de suppression d'image */}
            {imageToDelete && (
                <dialog className="active">
                    <AdminGalleryImageDelete
                        image={imageToDelete}
                        onClose={() => setImageToDelete(null)}
                        onSuccess={() => {
                            setImageToDelete(null);
                            setRefresh(!refresh);
                        }}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <AdminGalleryImagesButton
                albumId={album.id}
                onSuccess={() => setRefresh(!refresh)}
            />
        </div>
    );
};
