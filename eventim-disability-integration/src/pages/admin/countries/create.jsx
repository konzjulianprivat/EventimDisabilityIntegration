// country.jsx (in your Next.js pages or components folder)
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function CountryCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!formData.name.trim()) {
            setMessage('Name des Landes ist erforderlich');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/create-country', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Land „${data.country.name}“ erfolgreich erstellt!`);
                setFormData({ name: '', code: '' });
            } else {
                setMessage(data.message || 'Fehler beim Erstellen des Landes');
            }
        } catch (error) {
            console.error('Create country error:', error);
            setMessage('Serverfehler beim Erstellen des Landes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Neues Land anlegen</h1>

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
                    <label htmlFor="name" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Name des Landes *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="code" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        ISO-Code (optional)
                    </label>
                    <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="z.B. DE für Deutschland"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#002b55', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Bitte warten...' : 'Land erstellen'}
                </button>
            </form>
        </div>
    );
}