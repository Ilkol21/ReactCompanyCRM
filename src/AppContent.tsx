import React, { useEffect } from 'react';
import AppRoutes from './routes';
import Toaster from './components/common/Toaster';
import { injectStore } from './api/apiClient';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
    const authContext = useAuth();

    useEffect(() => {
        injectStore( authContext );
    }, [authContext]);

    return (
        <>
            <AppRoutes />
            <Toaster />
        </>
    );
};

export default AppContent;
