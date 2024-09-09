import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = () => {
        // Ваша логика проверки аутентификации
        return localStorage.getItem('authToken') !== null;
    };

    return isAuthenticated() ? children : <Navigate to="/login" />;
};

export default PrivateRoute;