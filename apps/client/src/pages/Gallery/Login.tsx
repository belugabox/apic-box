import { useForm } from 'react-hook-form';

import { useGalleryLogin } from '@/services/gallery';

export const GalleryLogin = ({ galleryId }: { galleryId: number }) => {
    const [login, loading, loginError] = useGalleryLogin(galleryId);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            password: '',
        },
    });

    const onSubmit = async (data: any) => {
        await login(data.password);
    };

    return (
        <div className="center medium-width padding">
            <h5>Cette galerie est protégée</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        type="password"
                        {...register('password', {
                            required: 'Le mot de passe est obligatoire.',
                        })}
                        className={errors.password ? 'invalid' : ''}
                    />
                    <label>Mot de passe</label>
                    {errors.password && (
                        <span className="error">{errors.password.message}</span>
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
