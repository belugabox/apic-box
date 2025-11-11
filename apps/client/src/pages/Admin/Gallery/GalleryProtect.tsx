import { useForm } from 'react-hook-form';

import { Gallery } from '@server/gallery/gallery.types';

import { useGalleryUpdatePassword } from '@/services/gallery';

interface AdminGalleryProtectProps {
    gallery: Gallery;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminGalleryProtect = ({
    gallery,
    onClose,
    onSuccess,
}: AdminGalleryProtectProps) => {
    const [updatePassword, loading, error] = useGalleryUpdatePassword(
        gallery.id,
    );

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            password: '',
        },
    });

    const passwordValue = watch('password');
    const onSubmit = async (gallery: { password: string }) => {
        await updatePassword(gallery.password).then(() => {
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
                        {...register('password', {
                            minLength: {
                                value: 8,
                                message:
                                    'Le mot de passe doit contenir au moins 8 caractères.',
                            },
                        })}
                        className={errors.password ? 'invalid' : ''}
                    />
                    <label>Mot de passe</label>
                    <span className="error-text">
                        {errors.password && errors.password.message}
                    </span>
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
                        {gallery.isProtected
                            ? passwordValue === ''
                                ? 'Retirer le mot de passe'
                                : 'Modifier le mot de passe'
                            : 'Ajouter un mot de passe'}
                    </button>
                </nav>
            </form>
        </div>
    );
};
