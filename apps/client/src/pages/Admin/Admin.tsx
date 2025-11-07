import { useUser, useLogout } from '../../services/auth';
import { Login } from './Login';
import { Actions } from './Actions';
import { GalleryEdit } from './GalleryEdit';
import { useState } from 'react';

export const Admin = () => {
    const [user] = useUser();
    const [logout] = useLogout();
    const [activeTab, setActiveTab] = useState<'actions' | 'gallery'>('actions');

    if (user?.role !== 'admin') {
        return <Login />;
    }

    return (
        <>
            <div className="tabs left-align">
                <a
                    className={activeTab === 'actions' ? 'active' : ''}
                    onClick={() => setActiveTab('actions')}
                >
                    Actions
                </a>
                <a
                    className={activeTab === 'gallery' ? 'active' : ''}
                    onClick={() => setActiveTab('gallery')}
                >
                    Gallery
                </a>
            </div>
            <div className="page padding active">
                {activeTab === 'actions' && <Actions />}
                {activeTab === 'gallery' && <GalleryEdit />}
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
