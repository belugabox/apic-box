import { useForm } from 'react-hook-form';

import type { Gallery } from '@server/modules/gallery';

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
                                    'Le code secret doit contenir au moins 8 caractères.',
                            },
                        })}
                        className={errors.password ? 'invalid' : ''}
                    />
                    <label>Code secret</label>
                    <span className="error">{errors.password?.message}</span>
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
                                ? 'Retirer le code secret'
                                : 'Modifier le code secret'
                            : 'Ajouter un code secret'}
                    </button>
                </nav>
            </form>
        </div>
    );
};
