import { useForm } from 'react-hook-form';

import { Gallery, EntityStatus } from '@shared';
import { galleryService } from '@/services/gallery.service';

interface AdminGalleryAddProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryAdd = ({
    onClose,
    onSuccess,
}: AdminGalleryAddProps) => {
    const [addGallery, loading, error] = galleryService.useAdd();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            id: 0,
            name: '',
            description: '',
            status: EntityStatus.DRAFT,
            isProtected: false,
            albums: [],
            createdAt: '',
            updatedAt: '',
        },
    });

    const onSubmit = async (gallery: Gallery) => {
        await addGallery(gallery).then(() => {
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
        <div>
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
                    <span className="error">{errors.name?.message}</span>
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
                    <span className="error">{errors.description?.message}</span>
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
                        Créer
                    </button>
                </nav>
            </form>
        </div>
    );
};
