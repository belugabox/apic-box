import { Outlet } from 'react-router';

import { Navigation } from './components/Navigation';
import { Spinner } from './components/Spinner';
import { useLoadingState } from './services/spinner';

export const App = () => {
    const loading = useLoadingState();
    return (
        <>
            <header className="fixed">
                <Navigation />
            </header>
            {loading && <Spinner></Spinner>}
            <main className="responsive padding">
                <Outlet />
            </main>
        </>
    );
};

export default App;
