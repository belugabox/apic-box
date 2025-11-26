import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import type { Album, Gallery } from '@shared';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/Error';
import { SubNavigation } from '@/components/SubNavigation';
import { UploadImageBtn } from '@/components/UploadImageBtn';
import { useSpinner } from '@/services/spinner';

import { AdminGalleryAlbumAdd } from './AlbumAdd';
import { AdminGalleryAlbumDelete } from './AlbumDelete';
import { AdminGalleryEdit } from './GalleryEdit';
import { AdminGalleryProtect } from './GalleryProtect';
import { galleryService } from '@/services/gallery.service';

type ModalType = 'edit' | 'protect' | 'addAlbum' | 'deleteAlbum';

export const AdminGallery = () => {
    const navigate = useNavigate();
    const params = useParams<{ galleryId: string }>();
    const galleryId = Number(params.galleryId || 0);

    const [show, setShow] = useState<ModalType>();
    const [selected, setSelected] = useState<Gallery | Album>();
    const [draggedAlbum, setDraggedAlbum] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const galleryFetchId = galleryId > 0 ? galleryId : undefined;
    const [gallery, loading, error] = galleryService.useGet(galleryFetchId ?? 0, true, [
        show,
        refreshTrigger,
    ]);
    const [exportGallery, exportLoading] = galleryService.useExport();
    const updateCoverFunc = galleryService.useUpdateCover(galleryId);
    const [reorderAlbums] = galleryService.useReorderAlbums(galleryId);

    useSpinner('AdminGallery', loading);

    if (!params.galleryId)
        return (
            <EmptyState icon="photo_album" title="La galerie n'existe pas" />
        );

    if (loading) return;
    if (error?.name === 'NotFoundError' || !gallery) {
        return (
            <EmptyState icon="photo_album" title="La galerie n'existe pas" />
        );
    }
    if (error) return <ErrorMessage error={error} />;

    const albums = gallery.albums || [];

    const handleClose = () => {
        setShow(undefined);
        setSelected(undefined);
    };

    const handleDragStart = (e: React.DragEvent, albumId: number) => {
        setDraggedAlbum(albumId);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (!draggedAlbum || draggedAlbum === targetId) {
            setDraggedAlbum(null);
            return;
        }

        const draggedIdx = albums.findIndex((a) => a.id === draggedAlbum);
        const targetIdx = albums.findIndex((a) => a.id === targetId);

        if (draggedIdx === -1 || targetIdx === -1) {
            setDraggedAlbum(null);
            return;
        }

        const newAlbums = [...albums];
        const [movedAlbum] = newAlbums.splice(draggedIdx, 1);
        newAlbums.splice(targetIdx, 0, movedAlbum);

        setIsReordering(true);
        try {
            const albumOrders = newAlbums.map((album, index) => ({
                albumId: Number(album.id),
                orderIndex: Number(index),
            }));
            await reorderAlbums({ albumOrders });
            setRefreshTrigger((prev) => prev + 1);
        } finally {
            setIsReordering(false);
            setDraggedAlbum(null);
        }
    };

    const handleExport = async () => {
        const blob = await exportGallery(galleryId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gallery.name}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <SubNavigation onClickBack={() => navigate('/admin/gallery')}>
                {gallery.name}
            </SubNavigation>
            {albums.length === 0 && (
                <EmptyState icon="photo_album" title={`La galerie est vide`} />
            )}
            <div className="grid">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        draggable={!isReordering}
                        onDragStart={(e) => handleDragStart(e, album.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, album.id)}
                        onDragEnd={() => setDraggedAlbum(null)}
                        className="s12 m6"
                        style={{
                            opacity: isReordering
                                ? 0.6
                                : draggedAlbum === album.id
                                  ? 0.5
                                  : 1,
                            cursor: isReordering ? 'wait' : 'grab',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <AlbumCard
                            className="s12"
                            galleryId={galleryId}
                            album={album}
                            fromAdmin={true}
                        >
                            <nav>
                                <button
                                    className="circle fill"
                                    onClick={() => {
                                        setShow('deleteAlbum');
                                        setSelected(album);
                                    }}
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
                    </div>
                ))}
            </div>

            <div className="large-space"></div>

            {/* Modals */}
            {show === 'edit' && selected && (
                <dialog className="active">
                    <AdminGalleryEdit
                        gallery={selected as Gallery}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {show === 'addAlbum' && (
                <dialog className="active">
                    <AdminGalleryAlbumAdd
                        galleryId={galleryId}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {show === 'deleteAlbum' && selected && (
                <dialog className="active">
                    <AdminGalleryAlbumDelete
                        album={selected as Album}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}
            {show === 'protect' && selected && (
                <dialog className="active">
                    <AdminGalleryProtect
                        gallery={selected as Gallery}
                        onClose={handleClose}
                        onSuccess={handleClose}
                    />
                </dialog>
            )}

            <div className="fixed center bottom bottom-margin row">
                <button
                    className="primary"
                    onClick={() => setShow('addAlbum')}
                    disabled={isReordering}
                >
                    <i>add</i>
                    <span>Créer un album</span>
                </button>
                <nav className="min active">
                    <button className="circle fill" disabled={isReordering}>
                        <i>more_vert</i>
                    </button>
                    <menu className="top left right-align transparent no-wrap">
                        <li>
                            <button
                                className="fill"
                                onClick={handleExport}
                                disabled={isReordering || exportLoading}
                            >
                                {!exportLoading ? (
                                    <i>upload</i>
                                ) : (
                                    <progress className="circle small"></progress>
                                )}
                                <span>Exporter les photos</span>
                            </button>
                        </li>
                        <li>
                            <UploadImageBtn
                                className="fill"
                                icon="photo"
                                text="Modifier la couverture"
                                useFunc={() => updateCoverFunc}
                                onSuccess={() => {}}
                            />
                        </li>
                        <li>
                            <button
                                className="fill"
                                onClick={() => {
                                    setShow('protect');
                                    setSelected(gallery);
                                }}
                                disabled={isReordering}
                            >
                                <i>
                                    {gallery.isProtected ? 'lock' : 'lock_open'}
                                </i>
                                <span>Modifier le code secret</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className="fill"
                                onClick={() => {
                                    setShow('edit');
                                    setSelected(gallery);
                                }}
                                disabled={isReordering}
                            >
                                <i>edit</i>
                                <span>Modifier la galerie</span>
                            </button>
                        </li>
                    </menu>
                </nav>
            </div>
        </>
    );
};
