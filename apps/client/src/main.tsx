import 'beercss';
import 'material-dynamic-colors';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './router';

ui('theme', '#6750a4');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
