import { useState } from 'react';
import { useEvents, useRegisterEvent } from '../services/event';

export const Events = () => {
    const [events, eventsLoading] = useEvents();
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [registerEvent, registerLoading] = useRegisterEvent();

    const toggleEvent = (eventId: string) => {
        setExpandedEventId(expandedEventId === eventId ? null : eventId);
        if (!formData[eventId]) {
            setFormData((prev) => ({
                ...prev,
                [eventId]: {
                    parentName: '',
                    parentEmail: '',
                    children: [{ name: '', class: '' }],
                },
            }));
        }
    };

    const handleInputChange = (
        eventId: string,
        field: 'parentName' | 'parentEmail',
        value: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                [field]: value,
            },
        }));
    };

    const handleChildChange = (
        eventId: string,
        childIndex: number,
        field: 'name' | 'class',
        value: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                children: prev[eventId].children.map((child: any, idx: number) =>
                    idx === childIndex ? { ...child, [field]: value } : child,
                ),
            },
        }));
    };

    const addChild = (eventId: string) => {
        setFormData((prev) => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                children: [...prev[eventId].children, { name: '', class: '' }],
            },
        }));
    };

    const removeChild = (eventId: string, childIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                children: prev[eventId].children.filter((_: any, idx: number) => idx !== childIndex),
            },
        }));
    };

    const handleRegister = async (eventId: string) => {
        const form = formData[eventId];
        if (
            !form ||
            !form.parentName ||
            !form.parentEmail ||
            form.children.some((c: any) => !c.name || !c.class)
        ) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            await registerEvent(eventId, form);
            alert('Inscription réussie!');
            setFormData((prev) => ({
                ...prev,
                [eventId]: {
                    parentName: '',
                    parentEmail: '',
                    children: [{ name: '', class: '' }],
                },
            }));
        } catch (error) {
            console.error('Error registering:', error);
            alert('Erreur lors de l\'inscription');
        }
    };

    if (eventsLoading) {
        return (
            <div className="container">
                <h1>Événements</h1>
                <p>Chargement...</p>
            </div>
        );
    }

    const eventsList = Array.isArray(events) ? events : [];

    return (
        <div className="container">
            <h1>Événements</h1>

            {eventsList.length === 0 ? (
                <p>Aucun événement disponible</p>
            ) : (
                <div>
                    {eventsList.map((event: any) => (
                        <article key={event.id} className="event-card">
                            <header>
                                <h2>{event.title}</h2>
                                <p>{event.description}</p>
                            </header>

                            <button onClick={() => toggleEvent(event.id)}>
                                {expandedEventId === event.id ? 'Masquer' : 'Afficher'} le formulaire
                            </button>

                            {expandedEventId === event.id && event.config?.type === 'registration' && (
                                <div className="registration-form">
                                    <h3>Formulaire d'inscription</h3>

                                    <div className="form-group">
                                        <label>Nom du parent</label>
                                        <input
                                            type="text"
                                            value={formData[event.id]?.parentName || ''}
                                            onChange={(e) =>
                                                handleInputChange(event.id, 'parentName', e.target.value)
                                            }
                                            placeholder="Entrez votre nom"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email du parent</label>
                                        <input
                                            type="email"
                                            value={formData[event.id]?.parentEmail || ''}
                                            onChange={(e) =>
                                                handleInputChange(event.id, 'parentEmail', e.target.value)
                                            }
                                            placeholder="Entrez votre email"
                                        />
                                    </div>

                                    <div className="children-section">
                                        <h4>Enfants</h4>
                                        {formData[event.id]?.children.map((child: any, idx: number) => (
                                            <div key={idx} className="child-form">
                                                <div className="form-group">
                                                    <label>Nom de l'enfant</label>
                                                    <input
                                                        type="text"
                                                        value={child.name}
                                                        onChange={(e) =>
                                                            handleChildChange(
                                                                event.id,
                                                                idx,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Nom"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Classe</label>
                                                    <input
                                                        type="text"
                                                        value={child.class}
                                                        onChange={(e) =>
                                                            handleChildChange(
                                                                event.id,
                                                                idx,
                                                                'class',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Ex: CM1"
                                                    />
                                                </div>

                                                {formData[event.id]?.children.length > 1 && (
                                                    <button
                                                        onClick={() => removeChild(event.id, idx)}
                                                        type="button"
                                                    >
                                                        Supprimer cet enfant
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addChild(event.id)}
                                            type="button"
                                            className="secondary"
                                        >
                                            + Ajouter un enfant
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleRegister(event.id)}
                                        disabled={registerLoading}
                                        className="primary"
                                    >
                                        {registerLoading ? 'Envoi...' : 'S\'inscrire'}
                                    </button>
                                </div>
                            )}

                            {expandedEventId === event.id && event.config?.type === 'photoGallery' && (
                                <div className="gallery-section">
                                    <h3>Galerie photo</h3>
                                    <p>Mot de passe requis pour accéder aux albums photos.</p>
                                    {/* TODO: Implémenter accès galerie photo protégée */}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
