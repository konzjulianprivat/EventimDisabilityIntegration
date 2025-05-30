import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CityCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        countryId: ''
    });
    const [countries, setCountries] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Länder für Dropdown laden
        fetch('http://localhost:4000/countries')
            .then(res => res.json())
            .then(data => setCountries(data.countries))
            .catch(err => console.error('Fehler beim Laden der Länder:', err));
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!formData.name.trim() || !formData.countryId) {
            setMessage('Name und Land sind erforderlich');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/create-city', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(`Stadt „${data.city.name}“ erfolgreich erstellt!`);
                setFormData({ name: '', countryId: '' });
            } else {
                setMessage(data.message || 'Fehler beim Erstellen der Stadt');
            }
        } catch (err) {
            console.error('Create city error:', err);
            setMessage('Serverfehler beim Erstellen der Stadt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Neue Stadt anlegen</h1>

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
                    <label htmlFor="name" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Stadtname *</label>
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
                    <label htmlFor="countryId" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Land *</label>
                    <select
                        id="countryId"
                        name="countryId"
                        value={formData.countryId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Bitte wählen</option>
                        {countries.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
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
                    {loading ? 'Bitte warten...' : 'Stadt erstellen'}
                </button>
            </form>
        </div>
    );
}
