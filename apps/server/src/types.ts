import { z } from 'zod';

export const EventTypeEnum = z.enum([
    'photo_session',
    'christmas_raffle',
    'halloween_raffle',
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const EventSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string(),
    type: EventTypeEnum,
    status: z.enum(['active', 'archived']).default('active'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type Event = z.infer<typeof EventSchema>;

export const EventRegistrationSchema = z.object({
    id: z.string().optional(),
    eventId: z.string(),
    username: z.string(),
    email: z.string().email(),
    registeredAt: z.date().optional(),
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
