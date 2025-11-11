import { ActionManager } from './action';
import { AuthManager } from './auth';
import { BlogManager } from './blog';
import { DbManager, db } from './db';
import { GalleryManager } from './gallery';

/**
 * Conteneur d'injection de dépendances
 */
export interface Container {
    db: DbManager;
    authManager: AuthManager;
    actionManager: ActionManager;
    galleryManager: GalleryManager;
    blogManager: BlogManager;
}

export const createContainer = (): Container => {
    // db est déjà initialisé lors du chargement du module db.ts

    // Ensuite les managers qui dépendent de db
    const authManager = new AuthManager();
    const actionManager = new ActionManager();
    const galleryManager = new GalleryManager();
    const blogManager = new BlogManager();

    return {
        db,
        authManager,
        actionManager,
        galleryManager,
        blogManager,
    };
};
