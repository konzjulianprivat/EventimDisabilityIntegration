// src/pages/registration.jsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Registration() {
    const router = useRouter();
    const { redirect } = router.query;

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

    // Holds all marks fetched from server:
    const [disabilityMarks, setDisabilityMarks] = useState([]);
    // Holds the mark_codes that the user has checked:
    const [selectedMarks, setSelectedMarks] = useState([]);

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 1) Prefill email/password from sessionStorage if present (unchanged)
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
            // Optionally remove from sessionStorage:
            // sessionStorage.removeItem('preRegEmail');
            // sessionStorage.removeItem('preRegPassword');
        }
    }, []);

    // 2) As soon as the component mounts, fetch all disability marks:
    useEffect(() => {
        async function fetchMarks() {
            try {
                const res = await fetch('http://localhost:4000/disability-marks');
                if (!res.ok) throw new Error('Failed to load disability marks');
                const json = await res.json();
                // Expecting json.marks to be an array of { mark_code, description, area_name }
                setDisabilityMarks(json.marks);
            } catch (err) {
                console.error('Error fetching disability marks:', err);
            }
        }
        fetchMarks();
    }, []);

    const handleChange = (e) => {
        const { name, type } = e.target;
        if (type === 'file') {
            setFormData({
                ...formData,
                [name]: e.target.files[0],
            });
        } else if (type === 'checkbox' && name === 'disabilityCheck') {
            // For the single “Ich habe einen Behindertenausweis” box:
            setFormData({
                ...formData,
                disabilityCheck: e.target.checked,
                // If unchecked, also clear degree and any selectedMarks:
                ...(e.target.checked
                    ? {}
                    : {
                        disabilityDegree: '',
                        disabilityCardImage: null,
                        // Clear any mark‐checkboxes if user unticks “I have a card”
                        selectedMarks: [],
                    }),
            });
            // If the user just cleared disabilityCheck, clear selectedMarks state:
            if (!e.target.checked) {
                setSelectedMarks([]);
            }
        } else {
            const { value } = e.target;
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // Called when the user toggles an individual mark‐checkbox
    const handleMarkToggle = (markCode) => {
        setSelectedMarks((prev) => {
            if (prev.includes(markCode)) {
                // Remove it
                return prev.filter((m) => m !== markCode);
            } else {
                // Add it
                return [...prev, markCode];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 1) Passwords match?
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwörter stimmen nicht überein');
            setLoading(false);
            return;
        }

        try {
            // Build FormData
            const payload = new FormData();
            // Append all existing simple fields except file and except we’ll handle marks separately
            Object.keys(formData).forEach((key) => {
                // We’ll append the file later. Also skip disabilityCardImage if null
                if (key === 'disabilityCardImage') return;
                payload.append(key, formData[key]);
            });

            // Append the file if present
            if (formData.disabilityCardImage) {
                payload.append('disabilityCardImage', formData.disabilityCardImage);
            }

            // Append the selected marks as a JSON string
            // (Server will parse JSON.parse(req.body.disabilityMarks))
            payload.append('disabilityMarks', JSON.stringify(selectedMarks));

            const response = await fetch('http://localhost:4000/register-user', {
                method: 'POST',
                body: payload,
            });
            const data = await response.json();

            if (response.ok) {
                setMessage('Registrierung erfolgreich! Weiterleitung...');
                const redirectParam = redirect
                    ? `?redirect=${encodeURIComponent(redirect)}`
                    : '';
                setTimeout(
                    () => router.push(`/login${redirectParam}`),
                    2000
                );
            } else {
                setMessage(data.message || 'Registrierung fehlgeschlagen');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setMessage('Fehler bei der Verbindung zum Server');
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
                {/* ---------------- Anrede ---------------- */}
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

                {/* ---------------- Vorname ---------------- */}
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

                {/* ---------------- Nachname ---------------- */}
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

                {/* ---------------- Firma ---------------- */}
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

                {/* ---------------- Straße und Hausnummer ---------------- */}
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

                {/* ---------------- PLZ / Stadt ---------------- */}
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

                {/* ---------------- Land ---------------- */}
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

                {/* ---------------- Geburtsdatum ---------------- */}
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

                {/* ---------------- Telefon ---------------- */}
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

                {/* ---------------- Behindertenausweis Checkbox ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="disabilityCheck"
                            name="disabilityCheck"
                            checked={formData.disabilityCheck || false}
                            onChange={handleChange}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <label htmlFor="disabilityCheck" style={{ fontWeight: 'bold' }}>
                            Ich habe einen Behindertenausweis
                        </label>
                    </div>
                </div>

                {/* ---------------- Wenn Behindertenausweis gesetzt, zeige Grad + Datei + Markierungen ---------------- */}
                {formData.disabilityCheck && (
                    <>
                        {/* Grad der Behinderung */}
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

                        {/* Behindertenausweis hochladen */}
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

                        {/* ---------------- Grad der Behinderung: Auswahl der Markierungen ---------------- */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
                            >
                                Grad der Behinderung – Markierungen
                            </label>

                            {/* Grid-Container für alle Marks */}
                            <div className="marks-grid">
                                {disabilityMarks.map((mark) => (
                                    <div key={mark.mark_code} className="mark-item">
                                        <input
                                            type="checkbox"
                                            id={`mark-${mark.mark_code}`}
                                            checked={selectedMarks.includes(mark.mark_code)}
                                            onChange={() => handleMarkToggle(mark.mark_code)}
                                            className="mark-checkbox"
                                        />
                                        <label
                                            htmlFor={`mark-${mark.mark_code}`}
                                            className="mark-label"
                                        >
                                            {mark.mark_code} – {mark.description}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ---------------- Submit Button ---------------- */}
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