import { useState } from 'react';
import { useUser, useLogout } from '../../services/auth';
import { useAdminEvents, useCreateEvent } from '../../services/event';
import { AdminLogin } from './AdminLogin';
import { AdminActions } from './AdminActions';

export const Admin = () => {
    const [user] = useUser();
    const [logout] = useLogout();

    if (user?.role !== 'admin') {
        return <AdminLogin />;
    }

    return (
        <>
            <div className="tabs left-align">
                <a className="active">Actions</a>
            </div>
            <div className="page padding active">
                <AdminActions />
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
