import { useState, useEffect } from 'react'
import { authService } from '../services/auth'
import { eventService } from '../services/event'

interface Event {
    id: string
    title: string
    description: string
    features: {
        registration: boolean
        photoGallery: boolean
        orders: boolean
    }
    status: string
    createdAt?: string
}

export const Admin = () => {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(false)
    const [showEventForm, setShowEventForm] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        features: {
            registration: false,
            photoGallery: false,
            orders: false,
        },
    })

    useEffect(() => {
        const isAdmin = authService.isAuthenticated() && authService.isAdmin()
        setIsAuthenticated(isAdmin)

        // Check if user is admin, if yes load events
        if (isAdmin) {
            loadEvents()
            setShowLoginModal(false)
        } else if (!authService.isAuthenticated()) {
            // Show login modal if not authenticated
            setShowLoginModal(true)
        }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError('')
        setIsLoggingIn(true)

        try {
            await authService.login(username, password)
            setUsername('')
            setPassword('')
            const isAdmin = authService.isAuthenticated() && authService.isAdmin()
            setIsAuthenticated(isAdmin)
            if (isAdmin) {
                setShowLoginModal(false)
                loadEvents()
            }
        } catch (err) {
            setLoginError('Login failed. Please check your credentials.')
            console.error(err)
        } finally {
            setIsLoggingIn(false)
        }
    }

    const loadEvents = async () => {
        try {
            setLoading(true)
            const data = await eventService.getAdminEvents()
            setEvents(data)
        } catch (error: any) {
            console.error('Error loading events:', error)
            // If we get 401 Unauthorized, clear tokens and show login modal
            if (error?.status === 401 || error?.message?.includes('401')) {
                console.log('[Admin] Received 401 - clearing tokens and showing login modal')
                authService.clearTokens()
                setIsAuthenticated(false)
                setShowLoginModal(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await eventService.createEvent({
                ...formData,
                status: 'active',
            })
            // Reset form and reload events
            setFormData({
                title: '',
                description: '',
                features: {
                    registration: false,
                    photoGallery: false,
                    orders: false,
                },
            })
            setShowEventForm(false)
            loadEvents()
        } catch (error: any) {
            console.error('Error creating event:', error)
            // If we get 401 Unauthorized, clear tokens and show login modal
            if (error?.status === 401 || error?.message?.includes('401')) {
                console.log('[Admin] Received 401 - clearing tokens and showing login modal')
                authService.clearTokens()
                setIsAuthenticated(false)
                setShowLoginModal(true)
            }
        }
    }

    // If not authenticated and admin, show page with content + login modal overlay
    return (
        <div>
            {!isAuthenticated && showLoginModal && (
                <div className="container center-align middle-align" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <article className="fill medium-height large-width">
                        <header>
                            <h3>Admin Login Required</h3>
                        </header>

                        {loginError && (
                            <article className="primary-container small">
                                <p>{loginError}</p>
                            </article>
                        )}

                        <form onSubmit={handleLogin}>
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />

                            <nav className="right-align">
                                <button
                                    type="submit"
                                    className="primary"
                                    disabled={isLoggingIn}
                                >
                                    {isLoggingIn ? 'Logging in...' : 'Login'}
                                </button>
                            </nav>
                        </form>

                        <footer>
                            <p><small>Default credentials: admin / admin</small></p>
                        </footer>
                    </article>
                </div>
            )}

            <h1>Admin Dashboard</h1>

            {!isAuthenticated ? (
                <article className="outline">
                    <p>Please login to access the admin dashboard.</p>
                </article>
            ) : (
                <>
                    <h2>Manage Events</h2>

                    {loading ? (
                        <p>Loading events...</p>
                    ) : (
                        <>
                            <nav className="margin small-margin">
                                <button
                                    onClick={() => setShowEventForm(!showEventForm)}
                                    className="primary"
                                >
                                    {showEventForm ? 'Cancel' : 'Create Event'}
                                </button>
                            </nav>

                            {showEventForm && (
                                <article className="fill medium-height">
                                    <header>
                                        <h5>Create New Event</h5>
                                    </header>
                                    <form onSubmit={handleCreateEvent}>
                                        <input
                                            type="text"
                                            placeholder="Event Title"
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            required
                                        />
                                        <textarea
                                            placeholder="Event Description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            required
                                        ></textarea>

                                        <h6>Features</h6>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.registration}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        features: {
                                                            ...formData.features,
                                                            registration: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            Registration
                                        </label>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.photoGallery}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        features: {
                                                            ...formData.features,
                                                            photoGallery: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            Photo Gallery
                                        </label>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.orders}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        features: {
                                                            ...formData.features,
                                                            orders: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            Orders / Store
                                        </label>
                                        <nav className="right-align">
                                            <button type="submit" className="primary">
                                                Create
                                            </button>
                                        </nav>
                                    </form>
                                </article>
                            )}

                            <div className="grid">
                                {events.map((event) => {
                                    // Ensure features has default values for old events
                                    const features = event.features || {
                                        registration: false,
                                        photoGallery: false,
                                        orders: false,
                                    };

                                    return (
                                        <article key={event.id} className="fill">
                                            <header>
                                                <h5>{event.title}</h5>
                                                <label>
                                                    <span className={`badge ${event.status === 'active' ? 'primary' : 'secondary'}`}>
                                                        {event.status}
                                                    </span>
                                                </label>
                                            </header>
                                            <p>{event.description}</p>
                                            <p>
                                                <small>
                                                    Features:{' '}
                                                    {[
                                                        features.registration && 'Registration',
                                                        features.photoGallery && 'Photo Gallery',
                                                        features.orders && 'Orders',
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ') || 'None'}
                                                </small>
                                            </p>
                                            <footer>
                                                <small>
                                                    Created: {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                                                </small>
                                            </footer>
                                        </article>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
