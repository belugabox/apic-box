import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Album } from '@server/gallery/gallery.types';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { useGallery } from '@/services/gallery';

import { AdminGalleryAlbumAdd } from './AlbumAdd';
import { AdminGalleryAlbumDelete } from './AlbumDelete';

export const AdminGallery = () => {
    const navigate = useNavigate();
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | undefined>();
    const params = useParams<{ galleryId: string }>();

    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    const galleryId = parseInt(params.galleryId, 10);

    const [gallery] = useGallery(galleryId, [showEdit, showDelete]);

    if (!gallery) {
        return null;
    }

    const albums = gallery.albums || [];

    const handleEdit = () => {
        setShowEdit(true);
        setSelectedAlbum(undefined);
    };
    const handleCloseEdit = () => {
        setShowEdit(false);
        setSelectedAlbum(undefined);
    };

    const handleDelete = (album: Album) => {
        setSelectedAlbum(album);
        setShowDelete(true);
    };
    const handleCloseDelete = () => {
        setShowDelete(false);
        setSelectedAlbum(undefined);
    };

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
                    {gallery.name}
                </h4>
                <p>
                    {albums.length} album{albums.length > 1 ? 's' : ''}
                </p>
            </div>
            <div className="grid">
                {albums.map((album) => (
                    <AlbumCard
                        className="s12 m6 l3"
                        key={album.id}
                        album={album}
                    >
                        <button
                            className="circle fill"
                            onClick={() => handleDelete(album)}
                        >
                            <i>delete</i>
                        </button>
                        <button
                            className="circle"
                            onClick={() =>
                                navigate(
                                    `/admin/gallery/${galleryId}/${album.id}`,
                                )
                            }
                        >
                            <i>edit</i>
                        </button>
                    </AlbumCard>
                ))}
            </div>
            <div className="medium-space"></div>
            {/* Modal d'ajout d'un album */}
            {showEdit && (
                <dialog className="active">
                    <AdminGalleryAlbumAdd
                        galleryId={galleryId}
                        onClose={handleCloseEdit}
                        onSuccess={() => handleCloseEdit()}
                    />
                </dialog>
            )}
            {/* Modal de suppression */}
            {showDelete && (
                <dialog className="active">
                    <AdminGalleryAlbumDelete
                        album={selectedAlbum}
                        onClose={handleCloseDelete}
                        onSuccess={() => {
                            handleCloseDelete();
                        }}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <button
                className="primary large fixed margin center bottom"
                onClick={() => handleEdit()}
            >
                <i>add</i>
                <span>Créer un album</span>
            </button>
        </div>
    );
};
