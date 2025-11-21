import { Hono } from 'hono';

import { Container, createContainer } from './container';
import { AppDataSource } from './db';
import { AuthModule } from './modules/auth';
import { BaseModule } from './modules/base.module';
import { BlogModule } from './modules/blog';
import { GalleryModule } from './modules/gallery';
import { errorHandler } from './tools/errorHandler';
import { logger } from './tools/logger';

// Container global - créé une seule fois
const container = createContainer();

export const getContainer = (): Container => {
    return container;
};

const authModule = new AuthModule();
const blogModule = new BlogModule();
const galleryModule = new GalleryModule();
const modules: BaseModule<any>[] = [authModule, blogModule, galleryModule];

// Exports du container
export const { db, authManager, galleryManager, blogManager } = container;

export const routes = () => {
    return new Hono()
        .onError(errorHandler)
        .route('/auth', authModule.routes())
        .route('/blog', blogModule.routes())
        .route('/gallery', galleryModule.routes());
};

export const init = async () => {
    await db.health();
    await AppDataSource.initialize();

    for (const module of modules) {
        await module.init();
    }

    await authManager.init();
    await blogManager.init();
    await galleryManager.init();
};

export const health = async () => {
    for (const module of modules) {
        await module
            .health()
            .then(() => {
                logger.info(`${module.name} health check successful`);
            })
            .catch((err: Error) => {
                logger.error(err, `${module.name} health check failed`);
            });
    }
    /*return Promise.all([
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
        galleryManager
            .health()
            .then(() => logger.info('GalleryManager connection successful'))
            .catch((err: Error) => {
                logger.error(err, 'GalleryManager connection failed');
            }),
    ]);*/
};
