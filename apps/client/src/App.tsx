import { Outlet } from 'react-router';

import { Navigation } from './components/Navigation';
import { Spinner } from './components/Spinner';
import { useLoadingState } from './services/spinner';

export const App = () => {
    const loading = useLoadingState();
    return (
        <>
            <header
                className=" white"
                style={{
                    height: '100%',
                    borderBottom: '1px solid #00000015',
                    boxShadow: '#00000010 0px 6px 8px 0px',
                }}
            >
                <Navigation />
            </header>
            {loading && <Spinner></Spinner>}
            <main
                className="responsive padding "
                style={{
                    maxWidth: '1000px',
                }}
            >
                <Outlet />
            </main>
        </>
    );
};

export default App;
