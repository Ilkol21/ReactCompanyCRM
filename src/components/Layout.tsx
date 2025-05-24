// src/components/Layout.tsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Вы вышли из системы');
        navigate('/signin');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h1 className="text-lg font-bold">My Company App</h1>
                <nav>
                    {user ? (
                        <>
                            <Link to="/dashboard/user" className="mr-4 hover:underline">
                                Dashboard
                            </Link>
                            <Link to="/companies" className="mr-4 hover:underline">
                                Companies
                            </Link>
                            <Link to="/profile" className="mr-4 hover:underline">
                                Profile
                            </Link>
                            <Link to="/history" className="mr-4 hover:underline">
                                History
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 px-3 py-1 rounded hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/signin" className="mr-4 hover:underline">
                                Sign In
                            </Link>
                            <Link to="/register" className="hover:underline">
                                Register
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            <main className="flex-grow container mx-auto p-4">
                <Outlet />
            </main>

            <footer className="bg-gray-200 p-4 text-center">
                &copy; {new Date().getFullYear()} My Company App
            </footer>
        </div>
    );
};

export default Layout;
