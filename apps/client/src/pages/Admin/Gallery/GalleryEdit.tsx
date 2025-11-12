import { useForm } from 'react-hook-form';

import { Gallery, GalleryStatus } from '@server/gallery/gallery.types';

import { useGalleryUpdate } from '@/services/gallery';

interface AdminGalleryEditProps {
    gallery: Gallery;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryEdit = ({
    gallery,
    onClose,
    onSuccess,
}: AdminGalleryEditProps) => {
    const [updateGallery, loading, error] = useGalleryUpdate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            id: gallery.id,
            name: gallery.name,
            description: gallery.description,
            status: gallery.status,
            createdAt: gallery.createdAt,
            updatedAt: gallery.updatedAt,
            albums: [],
            isProtected: gallery.isProtected,
        } satisfies Gallery,
    });

    const onSubmit = async (gallery: Gallery) => {
        await updateGallery(gallery).then(() => {
            reset();
            onSuccess?.();
            onClose?.();
        });
    };

    const handleCancel = () => {
        reset();
        onClose?.();
    };

    return (
        <div className="max">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        id="name"
                        type="text"
                        {...register('name', {
                            required: 'Le nom est obligatoire.',
                        })}
                        className={errors.name ? 'invalid' : ''}
                    />
                    <label>Nom</label>
                </div>
                <div className="field label border">
                    <input
                        id="description"
                        type="text"
                        {...register('description', {
                            required: 'La description est obligatoire.',
                        })}
                        className={errors.description ? 'invalid' : ''}
                    />
                    <label>Description</label>
                </div>
                <div className="field label border">
                    <select
                        id="status"
                        {...register('status', {
                            required: 'Le statut est obligatoire.',
                        })}
                        className={errors.status ? 'invalid' : ''}
                    >
                        <option value={GalleryStatus.DRAFT}>Brouillon</option>
                        <option value={GalleryStatus.PUBLISHED}>Publié</option>
                        <option value={GalleryStatus.ARCHIVED}>Archivé</option>
                    </select>
                    <label>Statut</label>
                </div>
                <span className="error-text">{error?.message}</span>
                <nav className="right-align">
                    <button
                        type="button"
                        className="border"
                        onClick={handleCancel}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="primary"
                    >
                        Mettre à jour
                    </button>
                </nav>
            </form>
        </div>
    );
};
