"use client";
import React, { useState, useEffect } from 'react';
import { useValidation } from '../hooks/useValidation';
import { useRouter } from 'next/router';
import DisabilityExpiredModal from '../components/DisabilityExpiredModal';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { redirect } = router.query;
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        if (user) {
            router.replace(redirect || '/');
        }
    }, [user, redirect]);

    // Login‐Form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(false);

    // Registrierungs‐States (unverändert)
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [emailExists, setEmailExists] = useState(false);

    const loginValidation = useValidation({ loginEmail: '', loginPassword: '' });
    const registerValidation = useValidation({ registerEmail: '', registerPassword: '' });

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const checkEmailExists = async (email) => {
        try {
            const res = await fetch(
                `http://localhost:4000/email-exists?email=${encodeURIComponent(email)}`
            );
            const data = await res.json();
            return data.exists;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (registerEmail && isValidEmail(registerEmail)) {
                const exists = await checkEmailExists(registerEmail);
                setEmailExists(exists);
            } else {
                setEmailExists(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [registerEmail]);

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
        if (!loginValidation.isValid()) {
            setLoginLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:4000/sessions', {
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
                        userId: data.user.userId,
                        email: data.user.email,
                        firstName: data.user.firstName,
                        lastName: data.user.lastName,
                        requestForDisability: data.user.requestForDisability,
                        isCurrentlyDisabled: data.user.isCurrentlyDisabled,
                        disabilityCardExpiryDate: data.user.disabilityCardExpiryDate,
                        disabilityMarks: data.user.disabilityMarks,
                        visibleUserId: data.user.visibleUserId,
                        role: data.user.role,
                        hasRoleAppointingCapability: data.user.hasRoleAppointingCapability,
                        hasDisabilityApprovalAccess: data.user.hasDisabilityApprovalAccess,
                        hasAccountManagementAccess: data.user.hasAccountManagementAccess,
                        hasCreationAccess: data.user.hasCreationAccess,
                        hasEditingAccess: data.user.hasEditingAccess,
                        hasDeletionPermission: data.user.hasDeletionPermission,
                    })
                );

                if (data.cardExpired) {
                    setShowExpiryModal(true);
                } else {
                    router
                        .push(redirect || '/')
                        .then(() => window.location.reload());
                }
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
        if (!registerValidation.isValid()) {
            return;
        }
        sessionStorage.setItem('preRegEmail', registerEmail.trim());
        sessionStorage.setItem('preRegPassword', registerPassword);
        const redirectParam = redirect
            ? `?redirect=${encodeURIComponent(redirect)}`
            : '';
        router.push(`/registration${redirectParam}`);
    };

    if (user) {
        return null;
    }

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
                                className={`input ${loginValidation.classFor('loginEmail', loginEmail)}`}
                                placeholder="E-Mail-Adresse eingeben"
                                value={loginEmail}
                                onChange={(e) => {
                                    setLoginEmail(e.target.value);
                                    loginValidation.validate('loginEmail', e.target.value, {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message:
                                            'Die E-Mail muss in einem validen E-Mail Format (bspw. Max.Mustermann@test.de) vorliegen',
                                    });
                                }}
                                onBlur={(e) =>
                                    loginValidation.validate('loginEmail', e.target.value, {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message:
                                            'Die E-Mail muss in einem validen E-Mail Format (bspw. Max.Mustermann@test.de) vorliegen',
                                    })
                                }
                                required
                            />
                            {loginValidation.errors.loginEmail && (
                                <div className="validation-msg">
                                    {loginValidation.errors.loginEmail}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="loginPassword" className="label">
                                Passwort
                            </label>
                            <input
                                type="password"
                                id="loginPassword"
                                name="loginPassword"
                                className={`input ${loginValidation.classFor('loginPassword', loginPassword)}`}
                                placeholder="Passwort eingeben"
                                value={loginPassword}
                                onChange={(e) => {
                                    setLoginPassword(e.target.value);
                                    loginValidation.validate('loginPassword', e.target.value, { required: true });
                                }}
                                onBlur={(e) => loginValidation.validate('loginPassword', e.target.value, { required: true })}
                                required
                            />
                            {loginValidation.errors.loginPassword && (
                                <div className="validation-msg">
                                    {loginValidation.errors.loginPassword}
                                </div>
                            )}
                        </div>
                        <div className="form-footer">
                            <a href="404.jsx" className="link-forgot">
                                Passwort vergessen?
                            </a>
                        </div>
                        <button
                            type="submit"
                            className="button-primary"
                            disabled={loginLoading || !loginValidation.isValid()}
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
                                className={`input ${registerValidation.classFor('registerEmail', registerEmail)}`}
                                placeholder="E-Mail-Adresse eingeben"
                                value={registerEmail}
                                onChange={(e) => {
                                    setRegisterEmail(e.target.value);
                                    registerValidation.validate('registerEmail', e.target.value, {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message:
                                            'Die E-Mail muss in einem validen E-Mail Format (bspw. Max.Mustermann@test.de) vorliegen',
                                    });
                                }}
                                onBlur={async (e) => {
                                    const value = e.target.value;
                                    const valid = registerValidation.validate('registerEmail', value, {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message:
                                            'Die E-Mail muss in einem validen E-Mail Format (bspw. Max.Mustermann@test.de) vorliegen',
                                    });
                                    if (valid && (await checkEmailExists(value))) {
                                        registerValidation.validate('registerEmail', value, {
                                            required: true,
                                            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Diese E-Mail ist bereits registriert.',
                                        });
                                    }
                                }}
                                required
                            />
                            {registerValidation.errors.registerEmail && (
                                <div className="validation-msg">
                                    {registerValidation.errors.registerEmail}
                                </div>
                            )}
                            {!registerValidation.errors.registerEmail && emailExists && (
                                <div className="validation-msg">
                                    Diese E-Mail ist bereits registriert.
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="registerPassword" className="label">
                                Neues Passwort
                            </label>
                            <input
                                type="password"
                                id="registerPassword"
                                name="registerPassword"
                                className={`input ${registerValidation.classFor('registerPassword', registerPassword)}`}
                                placeholder="Neues Passwort eingeben"
                                value={registerPassword}
                                onChange={(e) => {
                                    setRegisterPassword(e.target.value);
                                    registerValidation.validate('registerPassword', e.target.value, {
                                        required: true,
                                        pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                                        message: 'Passwort zu schwach',
                                    });
                                }}
                                onBlur={(e) =>
                                    registerValidation.validate('registerPassword', e.target.value, {
                                        required: true,
                                        pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                                        message: 'Passwort zu schwach',
                                    })
                                }
                                required
                            />
                            {registerValidation.errors.registerPassword && (
                                <div className="validation-msg">
                                    {registerValidation.errors.registerPassword}
                                </div>
                            )}
                        </div>
                        <p className="info-text">
                            Bitte gib mindestens acht Zeichen ein, es müssen Buchstaben (Groß- und
                            Kleinschreibung), Zahlen und Sonderzeichen enthalten sein.
                        </p>
                        <p className="info-text">
                            EVENTIM legt großen Wert auf Datenschutz. Die Datenschutzinformation kannst du{' '}
                            <a href="https://www.eventim.de/help/data-protection/?affiliate=GMD" className="link-inline">
                                hier
                            </a>{' '}
                            nachlesen.
                        </p>
                        <button
                            type="submit"
                            className="button-primary"
                            disabled={!registerValidation.isValid() || emailExists}
                        >
                            Weiter
                        </button>
                    </form>
                )}
            </div>
            {showExpiryModal && (
                <DisabilityExpiredModal
                    onClose={() => {
                        setShowExpiryModal(false);
                        router
                            .push(redirect || '/')
                            .then(() => window.location.reload());
                    }}
                />
            )}
        </div>
    );
}
