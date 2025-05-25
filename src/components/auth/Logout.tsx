import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = (): void => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div>
            <h1>Вы уверены, что хотите выйти?</h1>
            <button onClick={handleLogout}>Выйти</button>
        </div>
    );
};

export default LogoutPage;
