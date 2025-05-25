import axios from 'axios';
import { toast } from 'react-toastify';
import type { AuthContextType } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});


let authProviderApi: AuthContextType | null = null;

export const injectStore = (authApi: AuthContextType) => {
    authProviderApi = authApi;
};

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom(new Error("Token refresh failed."));
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

        if (error.response?.status === 401 && !originalRequest._retry &&
            originalRequest.url !== '/auth/login' &&
            originalRequest.url !== '/auth/register' &&
            originalRequest.url !== '/auth/refresh-token') {

            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true;

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


                authProviderApi?.login(newAccessToken, newRefreshToken, newUser);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);

                return apiClient(originalRequest);
            } catch (refreshError: any) {
                console.error("Token refresh failed:", refreshError);
                processQueue(refreshError, null);

                authProviderApi?.logout();
                toast.error('Session expired. Please log in again.');

                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.data?.message) {
            toast.error(error.response.data.message);
        } else if (error.message) {
            toast.error(error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;