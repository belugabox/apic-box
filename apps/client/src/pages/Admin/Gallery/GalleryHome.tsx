import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Gallery } from '@server/gallery/gallery.types';

import { ErrorMessage } from '@/components/Error';
import { GalleryCard } from '@/components/GalleryCard';
import { Spinner } from '@/components/Spinner';
import { StatusTag } from '@/components/StatusTag';
import { useGalleries } from '@/services/gallery';

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
    if (loading) return <Spinner />;
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
                        className="s12 m6 l3"
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
            <button
                className="primary large fixed margin center bottom"
                onClick={() => handleAdd()}
            >
                <i>add</i>
                <span>Créer une galerie</span>
            </button>
        </div>
    );
};
