import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'
import { App } from './App.tsx'
import { Home } from './pages/Home.tsx'
import { Events } from './pages/Events.tsx'
import { Admin } from './pages/Admin'
import { authService } from './services/auth'
import 'beercss'

// On app startup, check if we have tokens and validate them
// This helps clear invalid tokens (e.g., when JWT secret changes)
console.log('[App] Starting up...')
const hasTokens = authService.getAccessToken()
if (hasTokens) {
    console.log('[App] Found existing tokens, they will be validated on first API call')
}

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
                path: 'events',
                element: <Events />,
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
