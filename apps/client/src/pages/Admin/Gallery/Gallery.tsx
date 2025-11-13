import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Album, Gallery } from '@server/gallery/gallery.types';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { UploadImageBtn } from '@/components/UploadImageBtn';
import {
    useGallery,
    useGalleryExport,
    useGalleryUpdateCover,
} from '@/services/gallery';
import { spinner } from '@/services/spinner';

import { AdminGalleryAlbumAdd } from './AlbumAdd';
import { AdminGalleryAlbumDelete } from './AlbumDelete';
import { AdminGalleryEdit } from './GalleryEdit';
import { AdminGalleryProtect } from './GalleryProtect';

export const AdminGallery = () => {
    const navigate = useNavigate();
    const [show, setShow] = useState<
        'edit' | 'protect' | 'addAlbum' | 'deleteAlbum' | undefined
    >(undefined);
    const [selected, setSelected] = useState<Gallery | Album | undefined>();

    const params = useParams<{ galleryId: string }>();

    if (!params.galleryId) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    const galleryId = parseInt(params.galleryId, 10);

    const [gallery, loading, error] = useGallery(galleryId, true, [show]);
    const [exportGallery, exportLoading] = useGalleryExport();
    spinner('AdminGallery', loading);
    if (loading) return;
    if (error) return <ErrorMessage error={error} />;
    if (!gallery) {
        return (
            <EmptyState icon="photo_album" title={`La galerie n'existe pas`} />
        );
    }

    const albums = gallery.albums || [];

    const handleOpen = (
        newShow: typeof show,
        newSelected?: typeof selected,
    ) => {
        setShow(newShow);
        setSelected(newSelected);
    };
    const handleClose = () => {
        setShow(undefined);
        setSelected(undefined);
    };

    return (
        <div>
            <nav className="row left-align top-align">
                <button
                    type="button"
                    className="circle transparent"
                    onClick={async () => {
                        navigate('/admin/gallery');
                    }}
                >
                    <i>arrow_back</i>
                </button>
                <div className="max">
                    <h5 className="no-margin inline-block large-margin-left">
                        {gallery.name}
                    </h5>
                    <p className="no-margin">
                        {gallery.description} - {albums.length} album
                        {albums.length > 1 ? 's' : ''}
                    </p>
                </div>

                <UploadImageBtn
                    className="circle fill"
                    icon="photo"
                    useFunc={() => useGalleryUpdateCover(galleryId)}
                    onSuccess={() => setShow(show)}
                />
                <button
                    className="circle fill"
                    onClick={async () => {
                        const blob = await exportGallery(galleryId);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${gallery.name}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                    }}
                >
                    {!exportLoading ? (
                        <i>file_download</i>
                    ) : (
                        <progress className={`circle small`}></progress>
                    )}
                </button>
                <button
                    className="circle fill"
                    onClick={() => handleOpen('protect', gallery)}
                >
                    {gallery.isProtected ? <i>lock</i> : <i>lock_open</i>}
                </button>
                <button
                    className="circle"
                    onClick={() => handleOpen('edit', gallery)}
                >
                    <i>edit</i>
                </button>
            </nav>
            <div className="grid">
                {albums.map((album) => (
                    <AlbumCard
                        className="s12 m6"
                        key={album.id}
                        galleryId={galleryId}
                        album={album}
                    >
                        <nav>
                            <button
                                className="circle fill"
                                onClick={() => handleOpen('deleteAlbum', album)}
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
                        </nav>
                    </AlbumCard>
                ))}
            </div>
            <div className="medium-space"></div>
            {/* Modal d'édition */}
            {show === 'edit' && selected && (
                <dialog className="active">
                    <AdminGalleryEdit
                        gallery={selected as Gallery}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}

            {/* Modal d'ajout d'un album */}
            {show === 'addAlbum' && (
                <dialog className="active">
                    <AdminGalleryAlbumAdd
                        galleryId={galleryId}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Modal de suppression */}
            {show === 'deleteAlbum' && selected && (
                <dialog className="active">
                    <AdminGalleryAlbumDelete
                        album={selected as Album}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Modal de protection */}
            {show === 'protect' && selected && (
                <dialog className="active">
                    <AdminGalleryProtect
                        gallery={selected as Gallery}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <div className=" fixed margin center bottom">
                <button
                    className="primary large"
                    onClick={() => handleOpen('addAlbum')}
                >
                    <i>add</i>
                    <span>Créer un album</span>
                </button>
            </div>
        </div>
    );
};
