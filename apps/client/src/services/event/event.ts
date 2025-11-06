import { Observable } from 'rxjs';

import { Wrapper, toWrapperObservable } from '@/utils/wrapperObs';

import { authService } from '../auth';

const buildHeaders = (includeAuth = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (includeAuth) {
        const authHeaders = authService.headers();
        if (authHeaders.Authorization) {
            headers['Authorization'] = authHeaders.Authorization;
        }
    }
    return headers;
};

export class EventService {
    // Public events stream
    events(): Observable<Wrapper<any[]>> {
        return toWrapperObservable(() =>
            fetch(`${window.location.origin}/api/events`).then((r) => {
                if (!r.ok) throw new Error('Failed to fetch events');
                return r.json();
            }),
        );
    }

    // Register for an event
    async registerEvent(eventId: string, registration: any) {
        const response = await fetch(
            `${window.location.origin}/api/events/${eventId}/register`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registration),
            },
        );
        if (!response.ok) throw new Error('Failed to register for event');
        return response.json();
    }

    // Admin: Get all events
    adminEvents(): Observable<Wrapper<any[]>> {
        return toWrapperObservable(() =>
            fetch(`${window.location.origin}/api/admin/events`, {
                headers: buildHeaders(true),
            }).then((r) => {
                if (r.status === 401) {
                    authService.clearTokens();
                    throw new Error('Unauthorized - tokens cleared');
                }
                if (!r.ok) throw new Error('Failed to fetch events');
                return r.json();
            }),
        );
    }

    // Admin: Create a new event
    async createEvent(event: any) {
        const response = await fetch(
            `${window.location.origin}/api/admin/events`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...buildHeaders(true),
                },
                body: JSON.stringify(event),
            },
        );
        if (!response.ok) throw new Error('Failed to create event');
        return response.json();
    }

    // Admin: Get registrations for an event
    getEventRegistrations(eventId: string): Observable<Wrapper<any[]>> {
        return toWrapperObservable(() =>
            fetch(
                `${window.location.origin}/api/events/${eventId}/registrations`,
                {
                    headers: buildHeaders(true),
                },
            ).then((r) => {
                if (!r.ok) throw new Error('Failed to fetch registrations');
                return r.json();
            }),
        );
    }
}

export const eventService = new EventService();
