import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./components/Dashboard";
import PasswordReset from "./pages/PasswordReset";

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
                } />
                <Route path="/login" element={
                    user ? <Navigate to="/dashboard" /> : <Login />
                } />
                <Route path="/register" element={
                    user ? <Navigate to="/dashboard" /> : <Register />
                } />
                <Route path="/dashboard" element={
                    user ? <Dashboard /> : <Navigate to="/login" />
                } />
                <Route path="/password-reset" element={
                    user ? <Navigate to="/dashboard" /> : <PasswordReset />
                } />
            </Routes>
        </Router>
    );
};

export default App;