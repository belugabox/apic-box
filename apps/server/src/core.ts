import { ActionManager } from './action';
import { AuthManager } from './auth';
import { DbManager } from './db';
import { GalleryManager } from './gallery';
import { logger } from './tools/logger';

export const db = new DbManager();
export const authManager = new AuthManager();
export const actionManager = new ActionManager();
export const galleryManager = new GalleryManager();

export const init = async () => {
    await db.health();
    await authManager.init();
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
