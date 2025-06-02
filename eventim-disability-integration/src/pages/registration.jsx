// src/pages/registration.jsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Registration() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        phone: '',
        disabilityCheck: false,
        disabilityDegree: '',
        disabilityCardImage: null,
        streetAddress: '',
        city: '',
        postalCode: '',
        country: 'Deutschland',
        company: '',
        salutation: '',
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 1) Werte aus sessionStorage vorab befüllen (E-Mail + Passwort), aber nicht anzeigen
    useEffect(() => {
        const preEmail = sessionStorage.getItem('preRegEmail');
        const prePassword = sessionStorage.getItem('preRegPassword');

        if (preEmail || prePassword) {
            setFormData((prev) => ({
                ...prev,
                email: preEmail || '',
                password: prePassword || '',
                confirmPassword: prePassword || '',
            }));
            // Option: Danach entfernen, damit keine Reste verbleiben:
            // sessionStorage.removeItem('preRegEmail');
            // sessionStorage.removeItem('preRegPassword');
        }
    }, []);

    const handleChange = (e) => {
        const { name, type } = e.target;
        if (type === 'file') {
            setFormData({
                ...formData,
                [name]: e.target.files[0],
            });
        } else if (type === 'checkbox') {
            setFormData({
                ...formData,
                [name]: e.target.checked,
            });
        } else {
            const { value } = e.target;
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Passwort-Abgleich (intern, nicht sichtbar)
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwörter stimmen nicht überein');
            setLoading(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                if (key !== 'disabilityCardImage' || !formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });
            if (formData.disabilityCardImage) {
                formDataToSend.append(
                    'disabilityCardImage',
                    formData.disabilityCardImage
                );
            }

            const response = await fetch('http://localhost:4000/register-user', {
                method: 'POST',
                body: formDataToSend,
            });
            const data = await response.json();

            if (response.ok) {
                setMessage('Registrierung erfolgreich! Weiterleitung...');
                // Optional: Nach kurzer Verzögerung weiterleiten:
                // setTimeout(() => router.push('/login'), 2000);
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
        <div
            className="registration-container"
            style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}
        >
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Konto erstellen</h1>

            {message && (
                <div
                    style={{
                        padding: '0.75rem',
                        backgroundColor: message.includes('erfolgreich') ? '#d4edda' : '#f8d7da',
                        color: message.includes('erfolgreich') ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                    }}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Anrede */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="salutation"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
                        Anrede
                    </label>
                    <select
                        id="salutation"
                        name="salutation"
                        value={formData.salutation || ''}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    >
                        <option value="">Bitte wählen</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Divers">Divers</option>
                    </select>
                </div>

                {/* Vorname */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="firstName"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
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
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* Nachname */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="lastName"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
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
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* Firma */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="company"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
                        Firma
                    </label>
                    <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company || ''}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* Straße und Hausnummer */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="streetAddress"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
                        Straße und Hausnummer *
                    </label>
                    <input
                        type="text"
                        id="streetAddress"
                        name="streetAddress"
                        value={formData.streetAddress || ''}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* PLZ / Stadt */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: '1' }}>
                        <label
                            htmlFor="postalCode"
                            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                        >
                            PLZ *
                        </label>
                        <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode || ''}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        />
                    </div>
                    <div style={{ flex: '2' }}>
                        <label
                            htmlFor="city"
                            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                        >
                            Stadt *
                        </label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        />
                    </div>
                </div>

                {/* Land */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="country"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
                        Land *
                    </label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country || 'Deutschland'}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* E-Mail + Passwort sind unsichtbar, aber in formData enthalten */}

                {/* Geburtsdatum */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="birthDate"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
                        Geburtsdatum
                    </label>
                    <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* Telefon */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="phone"
                        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                    >
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
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* Behindertenausweis Checkbox */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="disabilityCheck"
                            name="disabilityCheck"
                            checked={formData.disabilityCheck || false}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    disabilityCheck: e.target.checked,
                                })
                            }
                            style={{ marginRight: '0.5rem' }}
                        />
                        <label htmlFor="disabilityCheck" style={{ fontWeight: 'bold' }}>
                            Ich habe einen Behindertenausweis
                        </label>
                    </div>
                </div>

                {/* Wenn Behindertenausweis gesetzt */}
                {formData.disabilityCheck && (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="disabilityDegree"
                                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                            >
                                Grad der Behinderung (0-100)
                            </label>
                            <input
                                type="number"
                                id="disabilityDegree"
                                name="disabilityDegree"
                                value={formData.disabilityDegree || ''}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="disabilityCardImage"
                                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                            >
                                Behindertenausweis hochladen
                            </label>
                            <input
                                type="file"
                                id="disabilityCardImage"
                                name="disabilityCardImage"
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                }}
                            />
                        </div>
                    </>
                )}

                {/* Submit Button */}
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
                        width: '100%',
                    }}
                >
                    {loading ? 'Bitte warten...' : 'Registrieren'}
                </button>
            </form>
        </div>
    );
}