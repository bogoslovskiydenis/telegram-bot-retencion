import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Navigate, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setMessage('Login successful');
            navigate('/dashboard');
        } catch (error) {
            setMessage('Invalid credentials');
            console.error('Login error:', error);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h2>Login</h2>
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
                <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Login</button>
            </form>
            {message && <p style={{ marginTop: '1rem', color: message.startsWith('Invalid') ? 'red' : 'green' }}>{message}</p>}
           <div style={{display: "flex" , alignItems:'center' , justifyContent: 'space-around'}}>
            {/*<button*/}
            {/*    onClick={() => navigate('/register')}*/}
            {/*    style={{*/}
            {/*        marginTop: '1rem',*/}
            {/*        padding: '0.5rem 1rem',*/}
            {/*        fontSize: '1rem',*/}
            {/*        backgroundColor: '#4CAF50',*/}
            {/*        color: 'white',*/}
            {/*        border: 'none',*/}
            {/*        cursor: 'pointer'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    Register*/}
            {/*</button>*/}
            {/*<button*/}
            {/*    onClick={() => navigate('/password-reset')}*/}
            {/*    style={{*/}
            {/*        marginTop: '1rem',*/}
            {/*        padding: '0.5rem 1rem',*/}
            {/*        fontSize: '1rem',*/}
            {/*        backgroundColor: '#4CAF50',*/}
            {/*        color: 'white',*/}
            {/*        border: 'none',*/}
            {/*        cursor: 'pointer'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    Forgot Password*/}
            {/*</button>*/}
           </div>
        </div>
    );
};

export default Login;