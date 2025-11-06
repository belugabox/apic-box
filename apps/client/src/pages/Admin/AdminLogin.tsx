import { useLogin } from "@/services/auth";
import { useState } from "react";

export const AdminLogin = () => {
    const [login, , loginError] = useLogin();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            setUsername('');
            setPassword('');
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    return (
        <article className="center medium-width padding">
            <form onSubmit={handleLogin}>
                <div className="field label border">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <label>Identifiant</label>
                </div>
                <div className="field label border">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <label>Mot de passe</label>
                </div>

                <nav className="right-align">
                    <button type="submit" className="primary">
                        Se connecter
                    </button>
                </nav>
            </form></article>
    );
};
