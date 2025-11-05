import { EventCard } from '../components/EventCard'
import { useState, useEffect } from 'react'
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
}

interface Registration {
    name: string
    email: string
}

export const Events = () => {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({})
    const [registrationForm, setRegistrationForm] = useState<Record<string, { name: string; email: string }>>({})

    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            setLoading(true)
            const data = await eventService.getEvents()
            setEvents(data)
            // Initialize registration forms for each event
            const forms: Record<string, { name: string; email: string }> = {}
            data.forEach((event: Event) => {
                forms[event.id] = { name: '', email: '' }
            })
            setRegistrationForm(forms)
        } catch (error) {
            console.error('Error loading events:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadRegistrations = async (eventId: string) => {
        try {
            const data = await eventService.getEventRegistrations(eventId)
            setRegistrations((prev) => ({ ...prev, [eventId]: data }))
        } catch (error) {
            console.error('Error loading registrations:', error)
        }
    }

    const toggleEventDetails = (eventId: string) => {
        if (expandedEventId === eventId) {
            setExpandedEventId(null)
        } else {
            setExpandedEventId(eventId)
            if (!registrations[eventId]) {
                loadRegistrations(eventId)
            }
        }
    }

    const handleRegister = async (eventId: string) => {
        try {
            const form = registrationForm[eventId]
            if (!form.name || !form.email) {
                alert('Veuillez remplir tous les champs')
                return
            }
            await eventService.registerEvent(eventId, {
                eventId,
                name: form.name,
                email: form.email,
            })
            alert('Inscription réussie!')
            setRegistrationForm((prev) => ({
                ...prev,
                [eventId]: { name: '', email: '' },
            }))
            // Reload registrations
            loadRegistrations(eventId)
        } catch (error) {
            console.error('Error registering for event:', error)
            alert('Erreur lors de l\'inscription')
        }
    }

    if (loading) {
        return (
            <div>
                <h1>Événements en cours</h1>
                <p>Chargement des événements...</p>
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div>
                <h1>Événements en cours</h1>
                <p>Aucun événement disponible pour le moment.</p>
            </div>
        )
    }

    return (
        <div>
            <h1>Événements en cours</h1>

            <div className="grid">
                {events.map((event) => (
                    <EventCard
                        key={event.id}
                        title={event.title}
                        icon="event"
                        description={event.description}
                    >
                        <button
                            className="primary round"
                            onClick={() =>
                                setRegistrationForm((prev) => ({
                                    ...prev,
                                    [event.id]: prev[event.id] || { username: '', email: '' },
                                }))
                            }
                        >
                            <i>person_add</i>
                            S'inscrire
                        </button>
                        <button
                            className="round"
                            onClick={() => toggleEventDetails(event.id)}
                        >
                            <i>info</i>
                            Détails
                        </button>
                    </EventCard>
                ))}
            </div>

            {/* Formulaires d'inscription */}
            {events.map((event) => (
                registrationForm[event.id] && (
                    <article key={`form-${event.id}`} className="fill">
                        <h5>Inscription à {event.title}</h5>
                        <input
                            placeholder="Votre nom"
                            type="text"
                            value={registrationForm[event.id].name}
                            onChange={(e) =>
                                setRegistrationForm((prev) => ({
                                    ...prev,
                                    [event.id]: { ...prev[event.id], name: e.target.value },
                                }))
                            }
                        />
                        <input
                            placeholder="Votre email"
                            type="email"
                            value={registrationForm[event.id].email}
                            onChange={(e) =>
                                setRegistrationForm((prev) => ({
                                    ...prev,
                                    [event.id]: { ...prev[event.id], email: e.target.value },
                                }))
                            }
                        />
                        <nav className="right-align">
                            <button
                                className="primary"
                                onClick={() => handleRegister(event.id)}
                            >
                                S'inscrire
                            </button>
                            <button
                                onClick={() =>
                                    setRegistrationForm((prev) => ({
                                        ...prev,
                                        [event.id]: { name: '', email: '' },
                                    }))
                                }
                            >
                                Annuler
                            </button>
                        </nav>
                    </article>
                )
            ))}

            {/* Détails des événements et inscriptions */}
            {expandedEventId && (
                <article className="fill">
                    <header>
                        <h4>
                            Inscriptions à {events.find((e) => e.id === expandedEventId)?.title}
                        </h4>
                    </header>
                    {registrations[expandedEventId]?.length > 0 ? (
                        <ul>
                            {registrations[expandedEventId]?.map((reg: any, idx: number) => (
                                <li key={idx}>
                                    {reg.username} ({reg.email})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune inscription pour le moment.</p>
                    )}
                </article>
            )}
        </div>
    )
}
