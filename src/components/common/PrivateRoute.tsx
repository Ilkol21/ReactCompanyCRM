import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { Role } from '../../types';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
    allowedRoles?: Role[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, hasRole } = useAuth();

    if (!isAuthenticated) {
        toast.info('You need to log in to access this page.');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
        toast.error('You do not have permission to access this page.');
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;