import { ActionCard } from "@/components/ActionCard";
import { useUser } from "@/services/auth";
import { useAdminEvents, useCreateEvent } from "@/services/event";
import { useState } from "react";

export const AdminActions = () => {
    const [user] = useUser();
    const [events, adminEventsLoading] = useAdminEvents(user?.role === 'admin');
    const [showEventForm, setShowEventForm] = useState(false);
    const [createEvent] = useCreateEvent();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        config: {
            type: 'registration' as 'registration' | 'photoGallery',
        },
    });

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

    return <>
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
                    <ActionCard className="s12 m6 l3" key={event.id} name={event.title} desc={event.description} >
                        <button className="circle fill">
                            <i>edit</i>
                        </button>
                    </ActionCard>
                ))}
            <div className="s12 large-margin"></div>
        </div>
        <button className="primary large fixed margin center bottom"
            onClick={() => setShowEventForm(!showEventForm)}>
            <i>add</i>
            <span>Créer une action</span>
        </button>
    </>;
}