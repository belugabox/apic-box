import { useLogin } from "@/services/auth";
import { useForm } from 'react-hook-form';

export const AdminLogin = () => {
    const [login, loading, loginError] = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            username: '',
            password: ''
        }
    });

    const onSubmit = async (data: any) => {
        await login(data.username, data.password);
    };

    return (
        <div className="center medium-width padding">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="field label border">
                    <input
                        id="username"
                        type="text"
                        {...register("username", {
                            required: "L'identifiant est obligatoire."
                        })}
                        className={errors.username ? 'invalid' : ''}
                    />
                    <label>Identifiant</label>
                    {errors.username && (
                        <span className="error">{errors.username.message}</span>
                    )}
                </div>
                <div className="field label border">
                    <input
                        type="password"
                        {...register("password", {
                            required: "Le mot de passe est obligatoire."
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
                        {!loading ? <i>login</i> : <progress className="circle small"></progress>}
                        Se connecter
                    </button>
                </nav>
            </form>
        </div>
    );
};
