import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ResetPassword from './components/auth/ResetPassword';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';
import  CompaniesList  from './components/companies/CompaniesList';
import CompanyDetail from './components/companies/CompanyDetail';
import Profile from './components/profile/Profile';
import ChangePassword from './components/profile/ChangePassword';
import HistoryPage from './components/history/HistoryPage';
import PrivateRoute from './components/common/PrivateRoute';
import { Role } from './types';
import { useAuth } from './context/AuthContext';
import CreateCompany from './components/companies/CreateCompany';

const AppRoutes: React.FC = () => {
    const { user, isAuthenticated } = useAuth();

    const getDashboardComponent = () => {
        if (!isAuthenticated || !user) {
            return <Navigate to="/login" replace />;
        }
        if (user.role === Role.SuperAdmin) {
            return <SuperAdminDashboard />;
        }
        if (user.role === Role.Admin) {
            return <AdminDashboard />;
        }
        if (user.role === Role.User) {
            return <UserDashboard />;
        }
        return <Navigate to="/login" replace />;
    };

    return (
        <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Перенаправление на дашборд при успешной аутентификации */}
            <Route path="/" element={isAuthenticated ? getDashboardComponent() : <Navigate to="/login" replace />} />
            <Route path="/dashboard" element={getDashboardComponent()} />

            {/* Защищенные маршруты для всех ролей */}
            <Route element={<PrivateRoute allowedRoles={[Role.User, Role.Admin, Role.SuperAdmin]} />}>
                <Route path="/companies" element={<CompaniesList />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/companies/create" element={<CreateCompany />} /> {/* <- обновлено здесь */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/change-password" element={<ChangePassword />} />
            </Route>

            {/* История доступна только для Admin и SuperAdmin */}
            <Route element={<PrivateRoute allowedRoles={[Role.Admin, Role.SuperAdmin]} />}>
                <Route path="/history" element={<HistoryPage />} />
            </Route>

            {/* Маршрут для выхода */}
            <Route path="/logout" element={<LogoutPage />} />

            {/* Обработка несуществующих маршрутов */}
            <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
    );
};

const LogoutPage: React.FC = () => {
    const { logout } = useAuth();
    React.useEffect(() => {
        logout();
    }, [logout]);
    return <Navigate to="/login" replace />;
};

export default AppRoutes;
