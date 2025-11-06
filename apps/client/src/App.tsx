




import { Outlet } from 'react-router'
import { Navigation } from './components/Navigation'

export const App = () => {
    return (
        <>
            <Navigation />
            <main className="responsive">
                <Outlet />
            </main>
        </>
    )
}

export default App