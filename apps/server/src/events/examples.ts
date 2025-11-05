/**
 * Exemples d'utilisation des événements avec les nouveaux types
 */
import { Event, EventType } from './events.types';

/**
 * Exemple 1 : Créer un événement d'inscription
 */
export const exampleRegistrationEvent: Event = {
    title: 'Inscription rentrée 2025',
    description: 'Inscrivez vos enfants pour la nouvelle année scolaire',
    config: {
        type: EventType.REGISTRATION,
    },
    status: 'active',
};

/**
 * Exemple 2 : Créer un événement galerie photo
 */
export const examplePhotoGalleryEvent: Event = {
    title: 'Album photos - Sortie à Paris',
    description: 'Découvrez les photos de notre sortie pédagogique',
    config: {
        type: EventType.PHOTO_GALLERY,
        password: 'secretPassword123',
        albums: [
            {
                id: 'album1',
                title: 'Matin - Musée du Louvre',
                description: 'Photos des enfants au musée',
            },
            {
                id: 'album2',
                title: 'Après-midi - Tour Eiffel',
                description: 'Photos à la Tour Eiffel',
            },
        ],
    },
    status: 'active',
};

/**
 * Type narrowing pour accéder aux propriétés spécifiques
 */
export const getEventTypeLabel = (event: Event): string => {
    switch (event.config.type) {
        case EventType.REGISTRATION:
            return 'Inscription';
        case EventType.PHOTO_GALLERY:
            return 'Galerie Photo';
        default:
            const _exhaustive: never = event.config;
            return _exhaustive;
    }
};

/**
 * Exemple d'utilisation avec type narrowing
 */
export const handlePhotoGalleryAccess = (
    event: Event,
    providedPassword: string,
): boolean => {
    if (event.config.type !== EventType.PHOTO_GALLERY) {
        return false;
    }
    // Maintenant TypeScript sait que event.config est PhotoGalleryEventConfig
    return event.config.password === providedPassword;
};
