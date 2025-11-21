import { useForm } from 'react-hook-form';

import type { Gallery } from '@server/modules/gallery';

import { useGalleryAdd } from '@/services/gallery';
import { EntityStatus } from '@server/modules/shared.types';

interface AdminGalleryAddProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryAdd = ({
    onClose,
    onSuccess,
}: AdminGalleryAddProps) => {
    const [addGallery, loading, error] = useGalleryAdd();

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
            createdAt: new Date(),
            updatedAt: new Date(),
            isProtected: false,
            albums: [],
        } satisfies Gallery,
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
