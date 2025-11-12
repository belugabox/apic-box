import { Navigate, createBrowserRouter } from 'react-router';

import App from './App';
import { AdminAlbum, AdminGallery, AdminHome } from './pages/Admin';
import { AdminGalleryHome } from './pages/Admin/Gallery/GalleryHome';
import { Gallery } from './pages/Gallery';
import { Album } from './pages/Gallery/Album';
import { GalleryHome } from './pages/Gallery/GalleryHome';
import { Home } from './pages/Home';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'admin',
                element: <AdminHome />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="gallery" replace />,
                    },
                    {
                        path: '*',
                        element: <></>,
                    },
                    {
                        path: 'gallery',
                        element: <AdminGalleryHome />,
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
                path: 'gallery',
                element: <GalleryHome />,
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
