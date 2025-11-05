import { authService } from '../auth';

export const eventService = {
    // Récupérer tous les événements (public)
    getEvents: async () => {
        try {
            const response = await fetch(
                `${window.location.origin}/api/events`,
            );
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    },

    // S'inscrire à un événement (public)
    registerEvent: async (eventId: string, registration: any) => {
        try {
            const response = await fetch(
                `${window.location.origin}/api/events/${eventId}/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(registration),
                },
            );
            if (!response.ok) {
                throw new Error('Failed to register for event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    },

    // Admin: Créer un nouvel événement
    createEvent: async (event: any) => {
        try {
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('Not authenticated');
            }
            const response = await fetch(
                `${window.location.origin}/api/admin/events`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                },
            );
            if (!response.ok) {
                throw new Error('Failed to create event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    // Admin: Récupérer tous les événements
    getAdminEvents: async () => {
        try {
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('Not authenticated');
            }
            const response = await fetch(
                `${window.location.origin}/api/admin/events`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    },

    // Admin: Récupérer les inscriptions à un événement
    getEventRegistrations: async (eventId: string) => {
        try {
            const token = authService.getAccessToken();
            if (!token) {
                throw new Error('Not authenticated');
            }
            const response = await fetch(
                `${window.location.origin}/api/events/${eventId}/registrations`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching registrations:', error);
            return [];
        }
    },
};
