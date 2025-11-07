import { useBehaviourSubject, usePromiseFunc } from '@/utils/Hooks';

import { authService } from './auth';

export { authService } from './auth';

// Hooks pour utiliser l'authentification dans les composants
export const useUser = () => {
    const [user, setUser, loading, error] = useBehaviourSubject(
        authService.user,
    );
    return [user, setUser, loading, error] as const;
};

export const useLogin = () =>
    usePromiseFunc(async (username: string, password: string) => {
        await authService.login(username, password);
    });

export const useLogout = () =>
    usePromiseFunc(async () => {
        authService.logout();
    });
