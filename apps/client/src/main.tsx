import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'
import { App } from './App'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import { GalleryEdit } from './pages/Admin/GalleryEdit'
import 'beercss'
import "material-dynamic-colors";
import { Actions } from './pages/Actions'
import { Gallery } from './pages/Gallery'
import { Album } from './pages/Gallery/Album'

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
                element: <Admin />,
            },
            {
                path: 'admin/gallery-edit',
                element: <GalleryEdit />,
            },
            {
                path: 'gallery/:galleryName',
                element: <Gallery />,
            },
            {
                path: 'gallery/:galleryName/:albumName',
                element: <Album />,
            },
            {
                path: '*',
                element: <Home />,
            },
        ],
    },
])


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
