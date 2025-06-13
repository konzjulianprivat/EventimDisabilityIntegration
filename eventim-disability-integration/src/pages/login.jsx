"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
    const router = useRouter();
    const { redirect } = router.query;
    const [activeTab, setActiveTab] = useState('login');

    // Login‐Form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Registrierungs‐States (unverändert)
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerError, setRegisterError] = useState('');

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
                // The API already returns camelCase properties, but we were
                // incorrectly using the snake_case variants here. This caused
                // `useAuth` to read `undefined` values from localStorage.
                localStorage.setItem(
                    'user',
                    JSON.stringify({
                        userId:    data.user.userId,
                        email:     data.user.email,
                        firstName: data.user.firstName,
                        lastName:  data.user.lastName,
                        disabilityCheck: data.user.disabilityCheck,
                        disabilityMarks: data.user.disabilityMarks,
                    })
                );
                router.push(redirect || '/').then(() => window.location.reload());
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

    // 2) Registrierungs‐Handler bleibt – nur Posten in sessionStorage + Redirect
    const handleRegisterRedirect = (e) => {
        e.preventDefault();
        setRegisterError('');

        if (!registerEmail.trim() || !registerPassword.trim()) {
            setRegisterError('Bitte E-Mail und Passwort eingeben.');
            return;
        }
        if (!isValidEmail(registerEmail.trim())) {
            setRegisterError('Bitte eine gültige E-Mail-Adresse eingeben.');
            return;
        }
        sessionStorage.setItem('preRegEmail', registerEmail.trim());
        sessionStorage.setItem('preRegPassword', registerPassword);
        const redirectParam = redirect
            ? `?redirect=${encodeURIComponent(redirect)}`
            : '';
        router.push(`/registration${redirectParam}`);
    };

    return (
        <div className="login-container">
            <h1 className="login-title">Anmelden oder registrieren</h1>

            <div className="tab-list">
                <button
                    className={`tab ${activeTab === 'login' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('login')}
                >
                    <div className="tab-label">Ich habe bereits ein Konto</div>
                    <div className="tab-subtitle">
                        Login mit E-Mail-Adresse und Passwort
                    </div>
                </button>
                <button
                    className={`tab ${activeTab === 'register' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    <div className="tab-label">Ich bin noch kein Kunde</div>
                    <div className="tab-subtitle">Neu registrieren und vollen Service nutzen</div>
                </button>
            </div>

            <div className="form-section">
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
                        <div className="form-footer">
                            <a href="#" className="link-forgot">
                                Passwort vergessen?
                            </a>
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

                {activeTab === 'register' && (
                    <form className="form-content" onSubmit={handleRegisterRedirect}>
                        {registerError && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                }}
                            >
                                {registerError}
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="registerEmail" className="label">
                                E-Mail-Adresse
                            </label>
                            <input
                                type="email"
                                id="registerEmail"
                                name="registerEmail"
                                className="input"
                                placeholder="E-Mail-Adresse eingeben"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="registerPassword" className="label">
                                Neues Passwort
                            </label>
                            <input
                                type="password"
                                id="registerPassword"
                                name="registerPassword"
                                className="input"
                                placeholder="Neues Passwort eingeben"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                            />
                        </div>
                        <p className="info-text">
                            Bitte gib mindestens acht Zeichen ein, es müssen Buchstaben (Groß- und
                            Kleinschreibung), Zahlen und Sonderzeichen enthalten sein.
                        </p>
                        <p className="info-text">
                            EVENTIM legt großen Wert auf Datenschutz. Die Datenschutzinformation kannst du{' '}
                            <a href="#" className="link-inline">
                                hier
                            </a>{' '}
                            nachlesen.
                        </p>
                        <button type="submit" className="button-primary">
                            Weiter
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}