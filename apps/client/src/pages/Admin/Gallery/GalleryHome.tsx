import { useState } from 'react';
import { useNavigate } from 'react-router';

import type { Gallery } from '@shared';

import { ErrorMessage } from '@/components/Error';
import { GalleryCard } from '@/components/GalleryCard';
import { StatusTag } from '@/components/StatusTag';
import { useGalleries } from '@/services/gallery';
import { useSpinner } from '@/services/spinner';

import { AdminGalleryAdd } from './GalleryAdd';
import { AdminGalleryDelete } from './GalleryDelete';

export const AdminGalleryHome = () => {
    const navigate = useNavigate();
    const [showAdd, setShowAdd] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedGallery, setSelectedGallery] = useState<
        Gallery | undefined
    >();
    const [galleries, loading, error] = useGalleries(true, [
        showAdd,
        showDelete,
    ]);
    useSpinner('AdminGalleryHome', loading);
    if (loading) return;
    if (error) return <ErrorMessage error={error} />;

    const handleAdd = () => {
        setSelectedGallery(undefined);
        setShowAdd(true);
    };
    const handleCloseAdd = () => {
        setShowAdd(false);
        setSelectedGallery(undefined);
    };

    const handleDelete = (gallery: Gallery) => {
        setSelectedGallery(gallery);
        setShowDelete(true);
    };
    const handleCloseDelete = () => {
        setShowDelete(false);
        setSelectedGallery(undefined);
    };
    
    return (
        <div>
            <div className="grid">
                {galleries?.map((gallery) => (
                    <GalleryCard
                        className="s12 m6"
                        key={gallery.id}
                        gallery={gallery}
                    >
                        <div className="max left-align">
                            <StatusTag status={gallery.status} />
                        </div>
                        <button
                            className="circle fill"
                            onClick={() => handleDelete(gallery)}
                        >
                            <i>delete</i>
                        </button>
                        <button
                            className="circle"
                            onClick={() =>
                                navigate(`/admin/gallery/${gallery.id}`)
                            }
                        >
                            <i>edit</i>
                        </button>
                    </GalleryCard>
                ))}
                <div className="s12 large-margin"></div>
            </div>
            {/* Modal de suppression */}
            {showDelete && (
                <dialog className="active">
                    <AdminGalleryDelete
                        gallery={selectedGallery}
                        onClose={handleCloseDelete}
                        onSuccess={() => {
                            handleCloseDelete();
                        }}
                    />
                </dialog>
            )}
            {/* Modal d'ajout */}
            {showAdd && (
                <dialog className="modal active">
                    <AdminGalleryAdd
                        onClose={handleCloseAdd}
                        onSuccess={() => {
                            handleCloseAdd();
                        }}
                    />
                </dialog>
            )}
            {/* Bouton d'ajout */}
            <div className="fixed center bottom bottom-margin row">
                <button className="primary" onClick={() => handleAdd()}>
                    <i>add</i>
                    <span>Créer une galerie</span>
                </button>
            </div>
        </div>
    );
};
