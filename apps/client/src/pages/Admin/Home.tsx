import { Link, Outlet, useLocation } from 'react-router';

import { useLogout, useUser } from '../../services/auth';
import { Login } from './Login';

export const AdminHome = () => {
    const location = useLocation();
    const page = location.pathname;
    const [user] = useUser();
    const [logout] = useLogout();

    if (user?.role !== 'admin') {
        return <Login />;
    }

    return (
        <>
            <div className="tabs left-align">
                <Link
                    to="/admin/gallery"
                    className={
                        page.startsWith('/admin/gallery') ? 'active' : ''
                    }
                >
                    Galerie
                </Link>
                <Link
                    to="/admin/blog"
                    className={page.startsWith('/admin/blog') ? 'active' : ''}
                >
                    Blog
                </Link>
            </div>

            <div className="padding">
                <Outlet />
            </div>

            {user && user.role === 'admin' && (
                <button
                    onClick={() => logout()}
                    className="absolute right top transparent circle"
                >
                    <i>logout</i>
                </button>
            )}
        </>
    );
};
