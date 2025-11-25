/* eslint-disable react-hooks/rules-of-hooks */
import { BehaviorSubject } from 'rxjs';

import { User } from '@server/modules/shared.types';

import { useBehaviourSubject, usePromiseFunc } from '@/utils/Hooks';
import { callRpc } from '@/utils/rpc';

import { serverApi } from './server';

/**
 * Service d'authentification
 * Gère la connexion, déconnexion, et l'état de l'utilisateur
 */
class AuthService {
    user = new BehaviorSubject<User | null>(this.getStoredUser());

    // Get headers with Authorization token
    headers(): Record<string, string> {
        const accessToken = localStorage.getItem('accessToken');
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    }

    // Check if user is admin
    isAdmin(): boolean {
        const user = this.getUser();
        return user?.role === 'admin';
    }

    // Hooks
    useUser = () => {
        const [user, setUser, loading, error] = useBehaviourSubject(
            authService.user,
        );
        return [user, setUser, loading, error] as const;
    };

    useLogin = () =>
        usePromiseFunc(async (username: string, password: string) => {
            await authService.login(username, password);
        });

    useLogout = () =>
        usePromiseFunc(async () => {
            authService.logout();
        });

    // Clear all auth tokens (useful when tokens become invalid)
    private clearTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.user.next(null);
    }

    // Login
    private async login(username: string, password: string) {
        try {
            const { accessToken, refreshToken, user } = await callRpc(
                serverApi.auth.login.$post({
                    form: { username, password },
                }),
            );
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            this.user.next(user);
            return { accessToken, refreshToken, user };
        } catch (error) {
            console.error('Error logging in:', error);
            this.clearTokens();
            throw error;
        }
    }

    // Logout
    private logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.user.next(null);
    }

    // Get stored user (internal)
    private getStoredUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Get stored user (public via BehaviorSubject)
    private getUser() {
        return this.user.getValue();
    }
}

export const authService = new AuthService();
