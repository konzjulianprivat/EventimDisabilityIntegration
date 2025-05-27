import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/nav-bar';
import '../styles/global.css';

export default function Registration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        phone: '',
        accessibilityNeeds: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwörter stimmen nicht überein');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registrierung erfolgreich! Weiterleitung...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setMessage(data.message || 'Registrierung fehlgeschlagen');
            }
        } catch (error) {
            setMessage('Fehler bei der Verbindung zum Server');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <NavBar />
            <div className="content">
                <div className="registration-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                    <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Konto erstellen</h1>

                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: message.includes('erfolgreich') ? '#d4edda' : '#f8d7da',
                            color: message.includes('erfolgreich') ? '#155724' : '#721c24',
                            borderRadius: '4px',
                            marginBottom: '1rem'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Vorname *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Nachname *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                E-Mail *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Passwort *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Passwort wiederholen *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="dateOfBirth" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Geburtsdatum
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Telefon
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="accessibilityNeeds" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Barrierefreiheitsbedürfnisse
                            </label>
                            <textarea
                                id="accessibilityNeeds"
                                name="accessibilityNeeds"
                                value={formData.accessibilityNeeds}
                                onChange={handleChange}
                                placeholder="Bitte teilen Sie uns mit, welche besonderen Anforderungen Sie haben"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    minHeight: '100px'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: '#002b55',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            {loading ? 'Bitte warten...' : 'Registrieren'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}