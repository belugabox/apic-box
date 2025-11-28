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
            <div className='row'>
                <div className="tabs left-align max">
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
                <span>
                    <i className='small secondary-text'>deployed_code</i>
                    <div className="tooltip left">
                        <span>{new Date(_APP_BUILD_DATE).toLocaleString()}</span>
                    </div>
                </span>                
                {user && user.role === 'admin' && (
                    <button
                        onClick={() => logout()}
                        className="transparent circle"
                    >
                        <i>logout</i>
                    </button>
                )}
            </div>

            <div className="padding">
                <Outlet />
            </div>

        </>
    );
};
