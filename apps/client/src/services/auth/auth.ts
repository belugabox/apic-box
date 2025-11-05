import { serverApi } from '../server';

export const authService = {
    // Clear all auth tokens (useful when tokens become invalid)
    clearTokens: () => {
        console.log('[Auth] Clearing invalid tokens from localStorage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Login
    login: async (username: string, password: string) => {
        try {
            console.log('[Auth] Attempting login for:', username);
            const response = await serverApi.auth.login.$post({
                json: { username, password },
            });
            if (!response.ok) {
                throw new Error('Login failed');
            }
            const data = await response.json();
            console.log('[Auth] Login successful, storing tokens');
            // Store tokens in localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            // Clear any partial tokens on login failure
            authService.clearTokens();
            throw error;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Get stored access token
    getAccessToken: () => {
        return localStorage.getItem('accessToken');
    },

    // Get stored user
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    },

    // Check if user is admin
    isAdmin: () => {
        const user = authService.getUser();
        return user?.role === 'admin';
    },

    // Refresh token
    refreshToken: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }
            const response = await serverApi.auth.refresh.$post({
                json: { refreshToken },
            });
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            return data;
        } catch (error) {
            console.error('Error refreshing token:', error);
            authService.logout();
            throw error;
        }
    },
};
