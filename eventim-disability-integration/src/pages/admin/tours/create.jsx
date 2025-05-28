// tours.jsx (Next.js Komponente mit Start- und Enddatum)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TourCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        artistId: '',
        tourImage: null
    });
    const [artists, setArtists] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:4000/artists')
            .then(res => res.json())
            .then(data => setArtists(data.artists))
            .catch(err => console.error('Fehler beim Laden der Künstler:', err));
    }, []);

    const handleChange = e => {
        const { name, type, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        if (!formData.title.trim() || !formData.startDate || !formData.endDate || !formData.artistId) {
            setMessage('Titel, Anfangs- und Enddatum sowie Künstler sind erforderlich');
            setLoading(false);
            return;
        }

        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('startDate', formData.startDate);
        fd.append('endDate', formData.endDate);
        fd.append('artistId', formData.artistId);
        if (formData.tourImage) fd.append('tourImage', formData.tourImage);

        try {
            const res = await fetch('http://localhost:4000/create-tour', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Tour „${data.tour.title}“ erstellt`);
                setFormData({ title: '', description: '', startDate: '', endDate: '', artistId: '', tourImage: null });
            } else {
                setMessage(data.message || 'Fehler beim Erstellen der Tour');
            }
        } catch (err) {
            console.error('Create tour error:', err);
            setMessage('Serverfehler beim Erstellen der Tour');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Neue Tour erstellen</h1>

            {message && (
                <div style={{
                    padding: '0.75rem',
                    backgroundColor: message.includes('erstellt') ? '#d4edda' : '#f8d7da',
                    color: message.includes('erstellt') ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>{message}</div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Titel *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="description" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Beschreibung</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="startDate" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Startdatum *</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="endDate" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Enddatum *</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="artistId" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Künstler *</label>
                    <select
                        id="artistId"
                        name="artistId"
                        value={formData.artistId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Bitte wählen</option>
                        {artists.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="tourImage" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tour-Bild hochladen</label>
                    <input
                        type="file"
                        id="tourImage"
                        name="tourImage"
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: '#002b55', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                >
                    {loading ? 'Bitte warten...' : 'Tour erstellen'}
                </button>
            </form>
        </div>
    );
}