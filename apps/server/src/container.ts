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
    galleryManager: GalleryManager;
    blogManager: BlogManager;
}

export const createContainer = (): Container => {
    const authManager = new AuthManager();
    const galleryManager = new GalleryManager();
    const blogManager = new BlogManager();

    return {
        db,
        authManager,
        galleryManager,
        blogManager,
    };
};
