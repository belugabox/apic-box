import { Outlet } from 'react-router';

import { Navigation } from './components/Navigation';

export const App = () => {
    return (
        <>
            <header className="fixed">
                <Navigation />
            </header>
            <main className="responsive">
                <Outlet />
            </main>
        </>
    );
};

export default App;
