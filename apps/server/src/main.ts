import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import * as fs from 'fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join } from 'path';

import { router } from './router';
import { logger } from './tools/logger';

const client_path = join(__dirname, '../../client/dist/');
const client_index_html = join(client_path, 'index.html');

const app = new Hono();

// CORS middleware
app.use('/api/*', cors());

// API routes
const routes = app.basePath('/api').route('/', router());
export type ServerType = typeof routes;

// Serve static files
app.use(
    '/*',
    serveStatic({
        root: './../client/dist/',
    }),
);

// Fallback to index.html for SPA
app.get('*', async (c) => {
    try {
        const htmlContent = await fs.promises.readFile(
            client_index_html,
            'utf-8',
        );
        return c.html(htmlContent);
    } catch (error) {
        return c.text('Not found', 404);
    }
});

// Start server
const port = process.env.PORT || 3001;

serve(
    {
        fetch: app.fetch,
        port: Number(port),
    },
    (info) => {
        logger.info(`Server started on http://localhost:${info.port}`);
    },
);
