import { z } from 'zod';

/**
 * Type d'événement - un événement ne peut être que d'un type à la fois
 */
export enum EventType {
    REGISTRATION = 'registration', // Inscription des enfants
    PHOTO_GALLERY = 'photoGallery', // Galerie photo protégée
}

/**
 * Configuration pour un événement d'inscription
 */
export const RegistrationEventConfigSchema = z.object({
    type: z.literal(EventType.REGISTRATION),
    // Les parents renseignent : nom, prénom, email, et pour chaque enfant : nom, classe
});

export type RegistrationEventConfig = z.infer<
    typeof RegistrationEventConfigSchema
>;

/**
 * Configuration pour une galerie photo
 */
export const PhotoGalleryEventConfigSchema = z.object({
    type: z.literal(EventType.PHOTO_GALLERY),
    password: z.string().min(1), // Mot de passe protégeant l'accès aux albums
    albums: z
        .array(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
            }),
        )
        .default([]),
});

export type PhotoGalleryEventConfig = z.infer<
    typeof PhotoGalleryEventConfigSchema
>;

/**
 * Configuration d'un événement - discriminated union par type
 */
export const EventConfigSchema = z.discriminatedUnion('type', [
    RegistrationEventConfigSchema,
    PhotoGalleryEventConfigSchema,
]);

export type EventConfig = z.infer<typeof EventConfigSchema>;

/**
 * Événement principal
 */
export const EventSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string(),
    config: EventConfigSchema,
    status: z.enum(['active', 'archived']).default('active'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Inscription d'un parent pour un événement
 */
export const ChildSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    class: z.string(),
});

export type Child = z.infer<typeof ChildSchema>;

export const EventRegistrationSchema = z.object({
    id: z.string().optional(),
    eventId: z.string(),
    parentName: z.string(),
    parentEmail: z.string().email(),
    children: z.array(ChildSchema).min(1), // Au moins un enfant
    registeredAt: z.date().optional(),
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
