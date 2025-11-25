import { Hono } from 'hono';

import { db } from './db';
import { Module } from './modules';
import { AuthModule } from './modules/auth';
import { BlogModule } from './modules/blog';
import { GalleryModule } from './modules/gallery';
import { errorHandler } from './tools/errorHandler';
import { logger } from './tools/logger';

export const authModule = new AuthModule();
const blogModule = new BlogModule();
const galleryModule = new GalleryModule();
const modules: Module[] = [authModule, blogModule, galleryModule];

export const init = async () => {
    await db.initialize();
    for (const module of modules) {
        await module.init();
    }
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
};

export const routes = () => {
    return new Hono()
        .onError(errorHandler)
        .route('/auth', authModule.routes())
        .route('/blog', blogModule.routes())
        .route('/gallery', galleryModule.routes());
};
