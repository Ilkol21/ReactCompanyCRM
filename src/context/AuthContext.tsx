// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { injectStore } from '../api/apiClient';
import { Role, type Company, type User } from '@/types';
import { normalizeRole } from '@/utils/roles';

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthContextType {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, user: User) => void;
    logout: () => void;
    updateUser: (newUser: Partial<User>) => void;
    hasRole: (requiredRole: Role) => boolean;
    isOwner: (resourceOwnerId: number | null | undefined) => boolean;
    socket: Socket | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tokens, setTokens] = useState<AuthTokens | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const queryClient = useQueryClient();

    // Логика входа
    const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
        const newTokens = { accessToken, refreshToken };
        setTokens(newTokens);
        const normalizedUser = { ...userData, role: normalizeRole(userData.role) };
        setUser(normalizedUser);
        setIsAuthenticated(true);
        localStorage.setItem('authTokens', JSON.stringify(newTokens));
        localStorage.setItem('user', JSON.stringify(normalizedUser));
    }, []);

    // Логика выхода
    const logout = useCallback(() => {
        setTokens(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');
    }, []);

    // При загрузке контекста, проверяем localStorage и токен
    useEffect(() => {
        const storedAuthTokens = localStorage.getItem('authTokens');
        const storedUser = localStorage.getItem('user');

        if (storedAuthTokens && storedUser) {
            try {
                const parsedTokens: AuthTokens = JSON.parse(storedAuthTokens);
                const parsedUser: User = JSON.parse(storedUser);
                parsedUser.role = normalizeRole(parsedUser.role);

                const decodedToken: { exp: number } = jwtDecode(parsedTokens.accessToken);
                if (decodedToken.exp * 1000 > Date.now()) {
                    setTokens(parsedTokens);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                } else {
                    console.warn('Access token expired on load. Logging out.');
                    logout();
                }
            } catch (error) {
                console.error('Failed to parse stored auth data or JWT decode error:', error);
                logout();
            }
        } else {
            setIsAuthenticated(false);
        }
    }, [logout]);

    // Обновление пользователя в состоянии и localStorage
    const updateUser = useCallback((newUser: Partial<User>) => {
        setUser((prevUser) => {
            if (prevUser) {
                const updatedUser = { ...prevUser, ...newUser };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
            }
            return null;
        });
    }, []);

    // Проверка ролей
    const hasRole = useCallback((requiredRole: Role): boolean => {
        if (!user) return false;
        const roleHierarchy = {
            [Role.User]: 1,
            [Role.Admin]: 2,
            [Role.SuperAdmin]: 3,
        };
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }, [user]);

    // Проверка владельца ресурса
    const isOwner = useCallback((resourceOwnerId: number | null | undefined): boolean => {
        if (!user || resourceOwnerId === undefined || resourceOwnerId === null) {
            return false;
        }
        return user.id === resourceOwnerId;
    }, [user]);

    // Обновляем API клиент и socket
    useEffect(() => {
        const authApiForInterceptor: AuthContextType = {
            user,
            tokens,
            isAuthenticated,
            login,
            logout,
            updateUser,
            hasRole,
            isOwner,
            socket: socketRef.current,
        };
        injectStore(authApiForInterceptor);
    }, [user, tokens, isAuthenticated, login, logout, updateUser, hasRole, isOwner]);

    // WebSocket подключение и управление
    useEffect(() => {
        if (isAuthenticated && tokens?.accessToken) {
            const newSocket = io(import.meta.env.VITE_WS_URL, {
                extraHeaders: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                },
                transports: ['websocket'],
            });

            newSocket.on('connect', () => {
                console.log('WebSocket connected:', newSocket.id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
            });

            newSocket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error.message);
                toast.error(`WebSocket connection error: ${error.message}`);
            });

            newSocket.on('companyUpdated', (updatedCompany: Company) => {
                toast.info(`Company "${updatedCompany.name}" was updated in real time!`);
                queryClient.invalidateQueries({ queryKey: ['companies'] });
                queryClient.invalidateQueries({ queryKey: ['company', updatedCompany.id] });
                queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
            });

            newSocket.on('companyDeleted', (data: { id: number }) => {
                toast.info(`Company (ID: ${data.id}) was deleted in real time!`);
                queryClient.invalidateQueries({ queryKey: ['companies'] });
                queryClient.invalidateQueries({ queryKey: ['company', data.id] });
                queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
            });

            newSocket.on('userUpdated', (updatedUser: User) => {
                toast.info(`User "${updatedUser.fullName}" was updated in real time!`);
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['userProfile', updatedUser.id] });
                if (user?.id === updatedUser.id) {
                    updateUser(updatedUser);
                }
            });

            newSocket.on('userDeleted', (data: { id: number }) => {
                toast.info(`User (ID: ${data.id}) was deleted in real time!`);
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['userProfile', data.id] });
                if (user?.id === data.id) {
                    logout();
                }
            });

            socketRef.current = newSocket;

            return () => {
                newSocket.disconnect();
                socketRef.current = null;
            };
        } else if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, [isAuthenticated, tokens?.accessToken, logout, queryClient, user?.id, updateUser]);

    const contextValue = React.useMemo(
        () => ({
            user,
            tokens,
            isAuthenticated,
            login,
            logout,
            updateUser,
            hasRole,
            isOwner,
            socket: socketRef.current,
        }),
        [user, tokens, isAuthenticated, login, logout, updateUser, hasRole, isOwner]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
