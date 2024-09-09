import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setMessage('Registration successful');
            // Redirect to login page after successful registration
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setMessage('User already created');
            } else {
                setMessage('Error registering user');
                console.error('Registration error:', error);
            }
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', fontSize: '1rem' }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', fontSize: '1rem' }}
                        required
                    />
                </div>
                <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Register</button>
            </form>
            {message && <p style={{ marginTop: '1rem', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
            <button
                onClick={() => navigate('/login')}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                Go to Login
            </button>
        </div>
    );
};

export default Register;