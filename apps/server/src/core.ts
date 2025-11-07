import { ActionManager, ActionStatus } from './action';
import { AuthManager } from './auth';
import { DbManager } from './db';
import { logger } from './tools/logger';

export const db = new DbManager();
export const authManager: AuthManager = new AuthManager();
export const actionManager: ActionManager = new ActionManager();

export const init = async () => {
    await db.health();
    await authManager.init();
    await actionManager.init();
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
    ]);
};

export const start = async () => {
    /*const newAction = await actionManager.add({
        id: 0,
        title: 'Test Action',
        description: 'This is a new action',
        status: ActionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const updatedAction = await actionManager.update({
        id: 1,
        title: 'Test Action',
        description: 'This is a updated action',
        status: ActionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    await actionManager.delete(2);
    const actions = await actionManager.list();
    logger.info(`Loaded ${actions.length} actions from the database.`);
    logger.info(newAction);
    logger.info(updatedAction);*/

    return true;
};

// ---
export const listActions = actionManager.all;
