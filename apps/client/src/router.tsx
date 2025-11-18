import { Navigate, createBrowserRouter } from 'react-router';

import App from './App';
import { AdminAlbum, AdminGallery, AdminHome } from './pages/Admin';
import { AdminBlogHome } from './pages/Admin/Blog/BlogHome';
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
                        element: <Navigate to="blog" replace />,
                    },
                    {
                        path: '*',
                        element: <></>,
                    },
                    {
                        path: 'blog',
                        element: <AdminBlogHome />,
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
