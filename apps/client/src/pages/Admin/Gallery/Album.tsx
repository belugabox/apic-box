import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import type { Album, Image } from '@shared';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { ImageCard } from '@/components/ImageCard';
import { Mansory } from '@/components/Mansonry';
import { SubNavigation } from '@/components/SubNavigation';
import { UploadImageBtn } from '@/components/UploadImageBtn';
import { useGallery, useGalleryAddImages } from '@/services/gallery';
import { useSpinner } from '@/services/spinner';

import { AdminGalleryAlbumEdit } from './AlbumEdit';
import { AdminGalleryImageDelete } from './ImageDelete';

export const AdminAlbum = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string; albumId: string }>();
    const [refresh, setRefresh] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<Image | null>(null);
    const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
    const galleryId = parseInt(params.galleryId || '', 10);
    const [gallery, loading, error] = useGallery(galleryId, true, [refresh]);
    const albumId = parseInt(params.albumId || '', 10);
    const addImages = useGalleryAddImages(albumId);

    useSpinner('AdminAlbum', loading);
    if (loading) return;
    if (error?.name === 'NotFoundError' || !gallery) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }
    if (error) return <ErrorMessage error={error} />;
    const album = gallery?.albums?.find((a) => a.id === albumId);
    if (!album) {
        return <EmptyState icon="photo_album" title={`L'album n'existe pas`} />;
    }

    return (
        <div>
            <SubNavigation
                onClickBack={() => navigate('/admin/gallery/' + galleryId)}
            >
                {gallery.name} - {album.name} ({album.code})
            </SubNavigation>
            {album.images?.length === 0 && (
                <EmptyState icon="photo_album" title={`L'album est vide`} />
            )}
            {album.images && album.images.length > 0 && (
                <Mansory>
                    {album.images.map((image) => (
                        <ImageCard
                            key={image.id}
                            galleryId={galleryId}
                            image={image}
                            zoomable={true}
                        >
                            <div className="max">{image.fullcode}</div>
                            <button
                                type="button"
                                className="circle small transparent"
                                onClick={() => setImageToDelete(image)}
                            >
                                <i>delete</i>
                            </button>
                        </ImageCard>
                    ))}
                </Mansory>
            )}
            <div className="large-space"></div>
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
            {/* Modal d'édition d'album */}
            {albumToEdit && (
                <dialog className="active">
                    <AdminGalleryAlbumEdit
                        album={albumToEdit}
                        onClose={() => setAlbumToEdit(null)}
                        onSuccess={() => {
                            setAlbumToEdit(null);
                            setRefresh(!refresh);
                        }}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <div className="fixed center bottom bottom-margin row">
                <UploadImageBtn
                    className="primary no-margin"
                    text="Ajouter des photos"
                    multiple
                    useFunc={() => addImages}
                    onSuccess={() => setRefresh(!refresh)}
                />
                <nav className="min active">
                    <button
                        className="circle fill"
                        onClick={() => setAlbumToEdit(album)}
                    >
                        <i>edit</i>
                    </button>
                </nav>
            </div>
        </div>
    );
};
