import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { authService } from '../services/auth'

export const Admin = () => {
    const navigate = useNavigate()
    const [user] = useState(authService.getUser())
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showEventForm, setShowEventForm] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'photo_session' as const,
    })

    useEffect(() => {
        // Check if user is admin
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
            navigate('/login')
            return
        }

        // Load events
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            setLoading(true)
            const token = authService.getAccessToken()
            const response = await fetch(`${window.location.origin}/api/admin/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setEvents(data)
            }
        } catch (error) {
            console.error('Error loading events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = authService.getAccessToken()
            const response = await fetch(`${window.location.origin}/api/admin/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'active',
                }),
            })
            if (response.ok) {
                const newEvent = await response.json()
                setEvents([...events, newEvent])
                setFormData({ title: '', description: '', type: 'photo_session' })
                setShowEventForm(false)
            }
        } catch (error) {
            console.error('Error creating event:', error)
        }
    }

    const handleLogout = () => {
        authService.logout()
        navigate('/login')
    }

    return (
        <div className="container">
            <header className="primary-container">
                <nav>
                    <h5 className="max">Admin Dashboard</h5>
                    <p><small>{user?.username}</small></p>
                    <button onClick={handleLogout} className="secondary">
                        Logout
                    </button>
                </nav>
            </header>

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
                                <label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                type: e.target.value as any,
                                            })
                                        }
                                    >
                                        <option value="photo_session">Photo Session</option>
                                        <option value="christmas_raffle">
                                            Christmas Raffle
                                        </option>
                                        <option value="halloween_raffle">
                                            Halloween Raffle
                                        </option>
                                    </select>
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
                        {events.map((event) => (
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
                                    <small>Type: {event.type}</small>
                                </p>
                                <footer>
                                    <small>
                                        Created: {new Date(event.createdAt).toLocaleDateString()}
                                    </small>
                                </footer>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
