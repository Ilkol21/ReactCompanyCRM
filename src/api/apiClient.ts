// src/api/apiClient.ts
import axios from 'axios';
import { toast } from 'react-toastify';
import type { AuthContextType } from '../context/AuthContext'; // <-- Fixed: Use 'type' for type-only import

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// We need a way to access the AuthContext's login/logout functions
// A simple object that will be populated by AuthProvider
let authProviderApi: AuthContextType | null = null;

// Function to inject the auth context's functions from AuthProvider
export const injectStore = (authApi: AuthContextType) => {
    authProviderApi = authApi;
};

// Flag for preventing multiple token refresh requests
let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            // If there's an error, reject the promises in the queue
            // You might need to adjust the error type passed to reject based on your needs
            // For now, we'll pass a generic Error
            prom(new Error("Token refresh failed.")); // Example: reject with a generic error
        } else {
            prom(token as string);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.request.use(
    (config) => {
        const authTokens = localStorage.getItem('authTokens');
        if (authTokens) {
            const { accessToken } = JSON.parse(authTokens);
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and it's not a login/register/refresh request,
        // and not already a retry
        if (error.response?.status === 401 && !originalRequest._retry &&
            originalRequest.url !== '/auth/login' &&
            originalRequest.url !== '/auth/register' &&
            originalRequest.url !== '/auth/refresh-token') {

            originalRequest._retry = true; // Mark as retry to prevent infinite loops

            // If a refresh token request is already in progress, add the current request to the queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true; // Set flag to indicate refresh process started

            try {
                const authTokens = localStorage.getItem('authTokens');
                if (!authTokens) {
                    throw new Error('No authentication tokens found. Please log in again.');
                }
                const { refreshToken } = JSON.parse(authTokens);

                if (!refreshToken) {
                    throw new Error('Refresh token missing. Please log in again.');
                }

                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
                const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: newUser } = response.data;

                // Update tokens and user info in AuthContext and localStorage
                // Use the injected authProviderApi to call login
                authProviderApi?.login(newAccessToken, newRefreshToken, newUser);

                // Update the authorization header for the original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Process all requests in the queue with the new token
                processQueue(null, newAccessToken);

                // Retry the original failed request
                return apiClient(originalRequest);
            } catch (refreshError: any) {
                console.error("Token refresh failed:", refreshError);
                processQueue(refreshError, null); // Reject all queued requests

                // Log out the user if refresh fails
                authProviderApi?.logout(); // Use the injected authProviderApi to call logout
                toast.error('Session expired. Please log in again.');

                // Redirect to login page
                // Using window.location.href is a forceful redirect, typically used when
                // React Router context isn't available, or for a full page reload.
                // If you want a softer navigation, you'd use `Maps` from `useNavigate`
                // within a component. For an interceptor, `window.location.href` is common.
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false; // Reset the flag
            }
        }

        // Handle other errors (display message)
        if (error.response?.data?.message) {
            toast.error(error.response.data.message);
        } else if (error.message) {
            toast.error(error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;