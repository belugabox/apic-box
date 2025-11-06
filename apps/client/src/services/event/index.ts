import { useAction, useObservable } from '@/utils/Hooks';

import { eventService } from './event';

export { eventService } from './event';

// Hooks pour utiliser le service dans les composants
export const useEvents = () => useObservable(eventService.events());
export const useAdminEvents = (enabled: boolean = true) =>
    useObservable(enabled ? eventService.adminEvents() : null, [enabled]);
export const useEventRegistrations = (eventId: string) =>
    useObservable(eventService.getEventRegistrations(eventId));

export const useRegisterEvent = () =>
    useAction(
        async (eventId: string, registration: any) =>
            await eventService.registerEvent(eventId, registration),
    );

export const useCreateEvent = () =>
    useAction(async (event: any) => await eventService.createEvent(event));
