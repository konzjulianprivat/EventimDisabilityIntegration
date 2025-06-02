import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ArtistCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        biography: '',
        website: '',
        artistImage: null
    });
    const [countries, setCountries] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Länder-Daten für Dropdown laden
        fetch('http://localhost:4000/countries')
            .then(res => res.json())
            .then(data => setCountries(data.countries))
            .catch(err => console.error('Fehler beim Laden der Länder:', err));
    }, []);

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, artistImage: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!formData.name.trim()) {
            setMessage('Name des Künstlers ist erforderlich');
            setLoading(false);
            return;
        }

        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('biography', formData.biography);
            fd.append('website', formData.website);
            if (formData.artistImage) fd.append('artistImage', formData.artistImage);

            const response = await fetch('http://localhost:4000/create-artist', {
                method: 'POST',
                body: fd
            });
            const data = await response.json();

            if (response.ok) {
                setMessage('Künstler erfolgreich erstellt!');
            } else {
                setMessage(data.message || 'Erstellung fehlgeschlagen');
            }
        } catch (error) {
            console.error('Artist creation error:', error);
            setMessage('Serverfehler beim Erstellen des Künstlers');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Neuen Künstler erstellen</h1>

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
                        Name *
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
                    <label htmlFor="biography" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Biografie
                    </label>
                    <textarea
                        id="biography"
                        name="biography"
                        value={formData.biography}
                        onChange={handleChange}
                        rows={4}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="website" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Website
                    </label>
                    <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="artistImage" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Künstlerbild hochladen
                    </label>
                    <input
                        type="file"
                        id="artistImage"
                        name="artistImage"
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#002b55', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Bitte warten...' : 'Künstler erstellen'}
                </button>
            </form>
        </div>
    );
}