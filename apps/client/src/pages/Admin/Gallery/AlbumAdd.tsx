import { useForm } from 'react-hook-form';

import { useGalleryAddAlbum } from '@/services/gallery';

interface AdminGalleryAlbumAddProps {
    galleryId: number;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryAlbumAdd = ({
    galleryId,
    onClose,
    onSuccess,
}: AdminGalleryAlbumAddProps) => {
    const [addAlbum, loading, error] = useGalleryAddAlbum(galleryId);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            name: '',
            code: '',
        },
    });
    const onSubmit = async (data: { name: string; code: string }) => {
        await addAlbum(data.name, data.code).then(() => {
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
                </div>
                <div className="field label border">
                    <input
                        id="code"
                        type="text"
                        {...register('code', {
                            required: 'Le code est obligatoire.',
                            min: {
                                value: 2,
                                message:
                                    'Le code doit contenir au moins 2 lettres.',
                            },
                            max: {
                                value: 3,
                                message:
                                    'Le code doit contenir au maximum 3 lettres.',
                            },
                        })}
                        className={errors.code ? 'invalid' : ''}
                    />
                    <label>Code (3 lettres)</label>
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
