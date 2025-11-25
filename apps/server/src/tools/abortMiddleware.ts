import { Context } from 'hono';

import { logger } from './logger';

/**
 * Middleware pour détecter et gérer les requêtes annulées par le client
 * Quand le client annule la requête (AbortSignal), Node.js émet un événement 'close'
 * Ce middleware permet de nettoyer les ressources et éviter les state updates inutiles
 */
export const abortMiddleware =
    () => async (c: Context, next: () => Promise<void>) => {
        const req = c.req.raw as any;
        let isAborted = false;

        // Détecter quand le client ferme la connexion (abort côté client)
        const abortHandler = () => {
            isAborted = true;
            logger.debug(
                {
                    method: c.req.method,
                    url: c.req.url,
                },
                'Client aborted request',
            );
        };

        // Vérifier si le type de requête supporte les événements
        if (req && typeof req.on === 'function') {
            req.on('close', abortHandler);
        }

        try {
            // Passer le flag d'abort dans le contexte
            (c.env as any).isAborted = () => isAborted;
            await next();
        } finally {
            if (req && typeof req.removeListener === 'function') {
                req.removeListener('close', abortHandler);
            }
        }
    };

/**
 * Helper pour vérifier si la requête a été annulée
 * Utilisable dans les handlers de routes
 */
export const isRequestAborted = (c: Context): boolean => {
    return (c.env as any).isAborted?.() ?? false;
};
