import { DbManager } from './manager';

/**
 * Singleton global de la base de données
 * Créé automatiquement lors du chargement du module db
 */
let dbInstance: DbManager | undefined;

export const createDbInstance = (): DbManager => {
    if (!dbInstance) {
        dbInstance = new DbManager();
    }
    return dbInstance;
};

export const getDb = (): DbManager => {
    if (!dbInstance) {
        throw new Error(
            'Database not initialized. Call createDbInstance() first.',
        );
    }
    return dbInstance;
};

// Export pour import directs - créé lors du premier accès au module
export let db: DbManager;

// Initialiser db au chargement du module pour éviter la dépendance circulaire
if (!dbInstance) {
    db = createDbInstance();
}
