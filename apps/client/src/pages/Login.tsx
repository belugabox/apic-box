import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authService } from '../services/auth'

export const Login = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await authService.login(username, password)
            navigate('/')
        } catch (err) {
            setError('Login failed. Please check your credentials.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container center-align middle-align" style={{ height: '100vh' }}>
            <article className="fill medium-height large-width">
                <header>
                    <h3>APIC Box Login</h3>
                </header>

                {error && (
                    <article className="primary-container small">
                        <p>{error}</p>
                    </article>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <nav className="right-align">
                        <button
                            type="submit"
                            className="primary"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </nav>
                </form>

                <footer>
                    <p><small>Default credentials: admin / admin</small></p>
                </footer>
            </article>
        </div>
    )
}
