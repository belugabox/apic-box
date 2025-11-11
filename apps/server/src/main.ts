import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import * as fs from 'fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join } from 'path';

import { health, init, start } from './core';
import { router } from './router';
import { isValid } from './tools/config';
import { logger } from './tools/logger';
import { requestLoggerMiddleware } from './tools/requestLoggerMiddleware';
import { timeoutMiddleware } from './tools/timeoutMiddleware';

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
app.use('/api/*', requestLoggerMiddleware());
app.use('/api/*', timeoutMiddleware(30000));
const routes = app.basePath('/api').route('/', router());
export type ServerType = typeof routes;

// ---
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

if (isValid) {
    (async () => {
        await init();
        await health();
        await start();
        startServer();
    })().catch((err) => {
        logger.error(err, 'Failed to start server');
        process.exit(1);
    });
}
