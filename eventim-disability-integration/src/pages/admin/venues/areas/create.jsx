"use client";

import React, { useState } from 'react';

export default function AreaCreation() {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const { name } = formData;
        if (!name.trim()) {
            setMessage('Name ist erforderlich');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:4000/create-area', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Bereich erfolgreich erstellt');
                setFormData({ name: '', description: '' });
            } else {
                setMessage(data.message || 'Fehler beim Erstellen');
            }
        } catch (err) {
            console.error(err);
            setMessage('Serverfehler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="creation-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Neuen Bereich anlegen</h1>

            {message && (
                <div
                    style={{
                        padding: '0.75rem',
                        backgroundColor: message.includes('erfolgreich') ? '#d4edda' : '#f8d7da',
                        color: message.includes('erfolgreich') ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>
                        Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* Beschreibung */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>
                        Beschreibung
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* Submit */}
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
                    {loading ? 'Bitte warten...' : 'Bereich erstellen'}
                </button>
            </form>
        </div>
    );
}
