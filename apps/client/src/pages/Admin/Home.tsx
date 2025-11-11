import { useState } from 'react';
import { Link, Outlet } from 'react-router';

import { useLogout, useUser } from '../../services/auth';
import { Login } from './Login';

export const AdminHome = () => {
    const [user] = useUser();
    const [logout] = useLogout();
    const [activeTab, setActiveTab] = useState<'actions' | 'gallery'>(
        'actions',
    );

    if (user?.role !== 'admin') {
        return <Login />;
    }

    return (
        <>
            <div className="tabs left-align">
                <Link
                    to="/admin/action"
                    className={activeTab === 'actions' ? 'active' : ''}
                    onClick={() => setActiveTab('actions')}
                >
                    Actions
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
