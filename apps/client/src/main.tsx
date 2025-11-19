import 'beercss';
import 'material-dynamic-colors';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './router';

ui('theme', '#6553BA');

// #6553BA
// #4D3C7B
// #F0B729
// #F15D58
// #4CC78F
// #C7F636
// #C1E235

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
