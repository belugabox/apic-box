import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'
import { App } from './App'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import 'beercss'
import "material-dynamic-colors";
import { Actions } from './pages/Actions'

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
        ],
    },
])


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
