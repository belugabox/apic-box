import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'
import { App } from './App.tsx'
import { Home } from './pages/Home.tsx'
import { Settings } from './pages/Settings.tsx'
import { Events } from './pages/Events.tsx'
import { Login } from './pages/Login.tsx'
import { Admin } from './pages/Admin.tsx'
import 'beercss'

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/admin',
        element: <Admin />,
    },
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'events',
                element: <Events />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
        ],
    },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
