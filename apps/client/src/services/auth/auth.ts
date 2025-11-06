import { BehaviorSubject } from 'rxjs';

import { callRpc } from '@/utils/rpc';

import { serverApi } from '../server';

export class AuthService {
    user = new BehaviorSubject<any>(this.getStoredUser());

    headers() {
        const token = this.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
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
            const data = await callRpc(
                serverApi.auth.login.$post({
                    json: { username, password },
                }) as any,
            );
            localStorage.setItem('accessToken', (data as any).accessToken);
            localStorage.setItem('refreshToken', (data as any).refreshToken);
            localStorage.setItem('user', JSON.stringify((data as any).user));
            this.user.next((data as any).user);
            return data;
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

    // Get stored access token
    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    // Get stored user (internal)
    private getStoredUser(): any {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Get stored user (public via BehaviorSubject)
    getUser(): any {
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

    // Refresh token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }
            const data = await callRpc(
                serverApi.auth.refresh.$post({
                    json: { refreshToken },
                }) as any,
            );
            localStorage.setItem('accessToken', (data as any).accessToken);
            return data;
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.logout();
            throw error;
        }
    }
}

export const authService = new AuthService();
