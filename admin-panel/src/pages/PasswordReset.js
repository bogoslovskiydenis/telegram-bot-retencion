import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent. Please check your inbox.');
        } catch (error) {
            setMessage('Error sending password reset email. Please try again.');
            console.error('Password reset error:', error);
        }
    };

    const handleGoToLogin = () => {
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h2>Password Reset</h2>
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
                <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
                    Reset Password
                </button>
            </form>
            {message && <p style={{ marginTop: '1rem', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
            <button
                onClick={handleGoToLogin}
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

export default PasswordReset;