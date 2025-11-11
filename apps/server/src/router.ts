import { Hono } from 'hono';

import { actionRoutes } from './action/action.router';
import { authRoutes } from './auth/auth.router';
import { galleryRoutes } from './gallery/gallery.router';
import { errorHandler } from './tools/errorHandler';

export const router = () =>
    new Hono()
        .onError(errorHandler)
        .route('/auth', authRoutes())
        .route('/actions', actionRoutes())
        .route('/gallery', galleryRoutes());
