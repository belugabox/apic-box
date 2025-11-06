import { useState, useEffect } from 'react';
import { useLogin, useUser, useLogout } from '../../services/auth';
import { useAdminEvents, useCreateEvent } from '../../services/event';
import { AdminLogin } from './AdminLogin';
import { Page } from '@/components/Page';

export const Admin = () => {
    const [user] = useUser();
    const [logout] = useLogout();
    const isAdmin = user?.role === 'admin';
    const [events, adminEventsLoading] = useAdminEvents(isAdmin);
    const [showEventForm, setShowEventForm] = useState(false);
    const [login, , loginError] = useLogin();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [createEvent] = useCreateEvent();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        config: {
            type: 'registration' as 'registration' | 'photoGallery',
        },
    });

    useEffect(() => {
        if (!isAdmin && !user) {
            setShowLoginModal(true);
        } else {
            setShowLoginModal(false);
        }
    }, [user, isAdmin]);

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

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createEvent({
                ...formData,
                status: 'active',
            });
            setFormData({
                title: '',
                description: '',
                config: {
                    type: 'registration',
                },
            });
            setShowEventForm(false);
        } catch (error: any) {
            console.error('Error creating event:', error);
        }
    };

    if (user?.role !== 'admin') {
        return <Page title='Administration' loading={false} >
            <AdminLogin />
        </Page>;
    }

    // If not authenticated and admin, show page with content + login modal overlay
    return (
        <div>

            <nav className="right-align" style={{ marginBottom: '1rem' }}>
                {user && user.role === 'admin' && (
                    <button
                        onClick={() => logout()}
                        className="secondary"
                    >
                        Logout
                    </button>
                )}
            </nav>

            <h1>Admin Dashboard</h1>

            {!user || user?.role !== 'admin' ? (
                <article className="outline">
                    <p>Please login to access the admin dashboard.</p>
                </article>
            ) : (
                <>
                    <h2>Manage Events</h2>

                    {adminEventsLoading ? (
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

                                        <h6>Event Type</h6>
                                        <label>
                                            <input
                                                type="radio"
                                                name="eventType"
                                                value="registration"
                                                checked={formData.config.type === 'registration'}
                                                onChange={() =>
                                                    setFormData({
                                                        ...formData,
                                                        config: { type: 'registration' },
                                                    })
                                                }
                                            />
                                            Registration (Parent inscription)
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="eventType"
                                                value="photoGallery"
                                                checked={formData.config.type === 'photoGallery'}
                                                onChange={() =>
                                                    setFormData({
                                                        ...formData,
                                                        config: { type: 'photoGallery' },
                                                    })
                                                }
                                            />
                                            Photo Gallery (Protected albums)
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
                                {Array.isArray(events) &&
                                    (events as any[]).map((event: any) => (
                                        <article key={event.id} className="fill">
                                            <header>
                                                <h5>{event.title}</h5>
                                                <label>
                                                    <span
                                                        className={`badge ${event.status === 'active' ? 'primary' : 'secondary'
                                                            }`}
                                                    >
                                                        {event.status}
                                                    </span>
                                                </label>
                                            </header>
                                            <p>{event.description}</p>
                                            <p>
                                                <small>Type: {event.config?.type || 'unknown'}</small>
                                            </p>
                                            <footer>
                                                <small>
                                                    Created:{' '}
                                                    {event.createdAt
                                                        ? new Date(event.createdAt).toLocaleDateString()
                                                        : 'N/A'}
                                                </small>
                                            </footer>
                                        </article>
                                    ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
