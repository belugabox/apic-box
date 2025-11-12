import { Hono } from 'hono';

import { authRoutes } from './auth/auth.router';
import { galleryRoutes } from './gallery/gallery.router';
import { errorHandler } from './tools/errorHandler';

export const router = () =>
    new Hono()
        .use('*', async (c, next) => {
            //await new Promise((resolve) => setTimeout(resolve, 5000)); // Délai de 500ms pour chaque requête
            await next();
        })
        .onError(errorHandler)
        .route('/auth', authRoutes())
        .route('/gallery', galleryRoutes());
