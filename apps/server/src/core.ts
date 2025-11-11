import { Container, createContainer } from './container';
import { logger } from './tools/logger';

// Container global - créé une seule fois
const container = createContainer();

export const getContainer = (): Container => {
    return container;
};

// Exports du container
export const { db, authManager, actionManager, galleryManager, blogManager } =
    container;

export const init = async () => {
    await db.health();

    await authManager.init();
    await blogManager.init();
    await actionManager.init();
    await galleryManager.init();
};

export const health = async () => {
    return Promise.all([
        db
            .health()
            .then(() => logger.info('DB connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'DB connection failed');
            }),
        authManager
            .health()
            .then(() => logger.info('AuthManager connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'AuthManager connection failed');
            }),
        blogManager
            .health()
            .then(() => logger.info('BlogManager connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'BlogManager connection failed');
            }),
        actionManager
            .health()
            .then(() => logger.info('ActionManager connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'ActionManager connection failed');
            }),
        galleryManager
            .health()
            .then(() => logger.info('GalleryManager connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'GalleryManager connection failed');
            }),
    ]);
};

export const start = async () => {
    return true;
};

// ---
export const listActions = actionManager.all;
