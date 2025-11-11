import 'beercss';
import 'material-dynamic-colors';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router';

import { App } from './App';
import { Actions } from './pages/Actions';
import {
    AdminAction,
    AdminAlbum,
    AdminGallery,
    AdminHome,
} from './pages/Admin';
import { Gallery } from './pages/Gallery';
import { Album } from './pages/Gallery/Album';
import { Home } from './pages/Home';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'actions',
                element: <Actions />,
            },
            {
                path: 'admin',
                element: <AdminHome />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="action" replace />,
                    },
                    {
                        path: '*',
                        element: <></>,
                    },
                    {
                        path: 'action',
                        element: <AdminAction />,
                    },
                    {
                        path: 'gallery/:galleryId',
                        element: <AdminGallery />,
                    },
                    {
                        path: 'gallery/:galleryId/:albumId',
                        element: <AdminAlbum />,
                    },
                ],
            },
            {
                path: 'gallery/:galleryId',
                element: <Gallery />,
            },
            {
                path: 'gallery/:galleryId/:albumId',
                element: <Album />,
            },
            {
                path: '*',
                element: <Home />,
            },
        ],
    },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
