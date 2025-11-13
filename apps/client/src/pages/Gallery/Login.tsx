import { useForm } from 'react-hook-form';

import { useGalleryLogin } from '@/services/gallery';

interface GalleryLoginProps {
    galleryId: number;
    onSuccess?: () => void;
}

export const GalleryLogin = ({ galleryId, onSuccess }: GalleryLoginProps) => {
    const [login, loading, loginError] = useGalleryLogin(galleryId);
    //TODO Gérer l'erreur de login "credentials invalid"
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            passwordGallery: '',
        },
    });

    const onSubmit = async (data: any) => {
        await login(data.passwordGallery);
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
