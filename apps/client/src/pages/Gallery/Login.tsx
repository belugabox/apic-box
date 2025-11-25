import { useForm } from 'react-hook-form';

import { galleryService } from '@/services/gallery.service';

interface GalleryLoginProps {
    galleryId: number;
    onSuccess?: () => void;
}

export const GalleryLogin = ({ galleryId, onSuccess }: GalleryLoginProps) => {
    const [login, loading, loginError] = galleryService.useLogin(galleryId);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            passwordGallery: '',
        },
    });

    const onSubmit = async ({
        passwordGallery,
    }: {
        passwordGallery: string;
    }) => {
        await login(passwordGallery);
        onSuccess?.();
    };

    return (
        <div className="center medium-width padding">
            <h5>Cette galerie est protégée</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        type="text"
                        autoComplete="off"
                        {...register('passwordGallery', {
                            required: 'Le code secret est obligatoire.',
                        })}
                        className={errors.passwordGallery ? 'invalid' : ''}
                    />
                    <label>Code secret</label>
                    {errors.passwordGallery && (
                        <span className="error">
                            {errors.passwordGallery.message}
                        </span>
                    )}
                </div>
                <nav className="right-align">
                    <span className="error-text">{loginError?.message}</span>
                    <button type="submit">
                        {!loading ? (
                            <i>login</i>
                        ) : (
                            <progress className="circle small"></progress>
                        )}
                        Se connecter
                    </button>
                </nav>
            </form>
        </div>
    );
};
