import { User } from '@shared';
import { BehaviorSubject } from 'rxjs';

import { callRpc } from '@/utils/rpc';

import { serverApi } from '../server';

export class AuthService {
    user = new BehaviorSubject<User | null>(this.getStoredUser());

    headers(): Record<string, string> {
        const accessToken = localStorage.getItem('accessToken');
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    }

    // Clear all auth tokens (useful when tokens become invalid)
    clearTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.user.next(null);
    }

    // Login
    async login(username: string, password: string) {
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
    logout(): void {
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
    getUser() {
        return this.user.getValue();
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
}

export const authService = new AuthService();
