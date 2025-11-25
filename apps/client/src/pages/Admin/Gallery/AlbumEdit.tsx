import { useForm } from 'react-hook-form';

import type { Album } from '@shared';

import { galleryService } from '@/services/gallery.service';

interface AdminGalleryAlbumAddProps {
    album: Album;
    onClose?: () => void;
    onSuccess?: () => void;
}

export const AdminGalleryAlbumEdit = ({
    album,
    onClose,
    onSuccess,
}: AdminGalleryAlbumAddProps) => {
    const [updateAlbum, loading, error] = galleryService.useEditAlbum(album.id);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            name: album.name,
            code: album.code,
            description: album.description || '',
        },
    });
    const onSubmit = async (data: { name: string; code: string; description: string }) => {
        await updateAlbum({ name: data.name, code: data.code, description: data.description }).then(() => {
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
                        id="code"
                        type="text"
                        {...register('code', {
                            required: 'Le code est obligatoire.',

                            minLength: {
                                value: 2,
                                message:
                                    'Le code doit contenir au moins 2 lettres.',
                            },
                            maxLength: {
                                value: 3,
                                message:
                                    'Le code doit contenir au maximum 3 lettres.',
                            },
                        })}
                        className={errors.code ? 'invalid' : ''}
                    />
                    <label>Code (3 lettres)</label>
                    <span className="error">{errors.code?.message}</span>
                </div>
                <div className="field label border">
                    <textarea
                        id="description"
                        {...register('description')}
                    />
                    <label>Description</label>
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
