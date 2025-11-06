import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { name, version } from '../../package.json';

export default defineConfig({
    define: {
        _APP_NAME: JSON.stringify(name),
        _APP_VERSION: JSON.stringify(version),
    },
    plugins: [tsconfigPaths(), react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                ws: true,
            },
        },
    },
});
