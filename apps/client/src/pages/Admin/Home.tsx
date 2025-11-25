import { Link, Outlet, useLocation } from 'react-router';

import { Login } from './Login';
import { authService } from '@/services/auth.service';

export const AdminHome = () => {
    const location = useLocation();
    const page = location.pathname;
    const [user] = authService.useUser();
    const [logout] = authService.useLogout();

    if (user?.role !== 'admin') {
        return <Login />;
    }

    return (
        <>
            <div className="tabs left-align">
                <Link
                    to="/admin/blog"
                    className={page.startsWith('/admin/blog') ? 'active' : ''}
                >
                    Blog
                </Link>
                <Link
                    to="/admin/gallery"
                    className={
                        page.startsWith('/admin/gallery') ? 'active' : ''
                    }
                >
                    Galerie
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
