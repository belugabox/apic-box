import { useUser, useLogout } from '../../services/auth';
import { Login } from './Login';
import { Actions } from './Actions';

export const Admin = () => {
    const [user] = useUser();
    const [logout] = useLogout();

    if (user?.role !== 'admin') {
        return <Login />;
    }

    return (
        <>
            <div className="tabs left-align">
                <a className="active">Actions</a>
            </div>
            <div className="page padding active">
                <Actions />
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
