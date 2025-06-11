"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
    const router = useRouter();
    const [activeTab] = useState('login');

    // Login‐Form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // 1) Login‐Handler: jetzt mit credentials: 'include'
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        if (!loginEmail.trim() || !loginPassword.trim()) {
            setLoginError('Bitte E-Mail und Passwort eingeben.');
            setLoginLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:4000/login-user', {
                method: 'POST',
                credentials: 'include',              // ← Cookie einschließen
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail.trim(),
                    password: loginPassword,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem(
                    'user',
                    JSON.stringify({
                        userId:    data.user.userId,
                        email:     data.user.email,
                        firstName: data.user.firstName,
                        lastName:  data.user.lastName,
                    })
                );
                router.push('/').then(() => window.location.reload());
            } else {
                setLoginError(data.message || 'Ungültige Anmeldedaten.');
            }
        } catch (err) {
            console.error('Login request error:', err);
            setLoginError('Serverfehler beim Einloggen.');
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="AS-login-container">
            <h1 className="AS-login-title">SERVICE-LOGIN</h1>

            <div className="AS-form-section">
                {activeTab === 'login' && (
                    <form className="form-content" onSubmit={handleLogin}>
                        {loginError && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                }}
                            >
                                {loginError}
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="loginEmail" className="label">
                                E-Mail-Adresse
                            </label>
                            <input
                                type="email"
                                id="loginEmail"
                                name="loginEmail"
                                className="input"
                                placeholder="E-Mail-Adresse eingeben"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loginPassword" className="label">
                                Passwort
                            </label>
                            <input
                                type="password"
                                id="loginPassword"
                                name="loginPassword"
                                className="input"
                                placeholder="Passwort eingeben"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="button-primary"
                            disabled={loginLoading}
                        >
                            {loginLoading ? 'Bitte warten...' : 'Anmelden'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}