import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import * as fs from 'fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join } from 'path';
import 'reflect-metadata';

import { health, init, routes } from './core';
import { abortMiddleware } from './middlewares/abortMiddleware';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware';
import { requestLoggerMiddleware } from './middlewares/requestLoggerMiddleware';
import { timeoutMiddleware } from './middlewares/timeoutMiddleware';
// Load and validate environment variables
import './utils/env';
import { logger } from './utils/logger';

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
    logger.error(err, 'unhandledRejection');
    process.exit(1);
});
const client_path = join(__dirname, '../../client/dist/');
const client_index_html = join(client_path, 'index.html');

const app = new Hono();

// ---
app.use('/api/*', cors());
app.use('/api/*', rateLimitMiddleware);
app.use('/api/*', abortMiddleware());
app.use('/api/*', requestLoggerMiddleware());
app.use('/api/*', timeoutMiddleware(120000));
const appRoutes = app.basePath('/api').route('/', routes());
export type ServerType = typeof appRoutes;

// Middleware for X-Robots-Tag headers
app.use('/*', async (c, next) => {
    // Disallow indexing of API routes
    if (c.req.path.startsWith('/api/')) {
        c.header('X-Robots-Tag', 'noindex, nofollow');
    }
    // Disallow indexing of admin routes
    else if (
        c.req.path.startsWith('/admin') ||
        c.req.path.startsWith('/Auth')
    ) {
        c.header('X-Robots-Tag', 'noindex, nofollow');
    }
    // Allow indexing of public routes
    else {
        c.header('X-Robots-Tag', 'index, follow');
    }
    await next();
});
// Sitemap endpoint
app.get('/sitemap.xml', (c) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.apic-sentelette.net/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://www.apic-sentelette.net/gallery</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>`;
    c.header('Content-Type', 'application/xml; charset=utf-8');
    c.header('X-Robots-Tag', 'index, follow');
    return c.text(xml);
});

app.use(
    '/*',
    serveStatic({
        root: './../client/dist/',
    }),
);
app.get('*', async (c) => {
    const htmlContent = await fs.promises.readFile(client_index_html, 'utf-8');
    return c.html(htmlContent);
});

// ---
const startServer = () => {
    serve(
        {
            fetch: app.fetch,
            port: 3001,
        },
        (info) =>
            logger.info(`Server started on http://localhost:${info.port}`),
    );
    //initWS(server);
};

(async () => {
    await init();
    await health();
    startServer();
})().catch((err) => {
    logger.error(err, 'Failed to start server');
    process.exit(1);
});
