// genres.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function GenreCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
    });
    const [subgenres, setSubgenres] = useState([]); // [{ name: '' }]
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((f) => ({ ...f, [name]: value }));
    };

    const addSubgenre = () => {
        setSubgenres((sg) => [...sg, { name: '' }]);
    };

    const updateSubgenre = (index, value) => {
        setSubgenres((sg) =>
            sg.map((it, idx) => (idx === index ? { name: value } : it))
        );
    };

    const removeSubgenre = (index) => {
        setSubgenres((sg) => sg.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!formData.name.trim()) {
            setMessage('Bitte gib einen Genre-Namen an');
            setLoading(false);
            return;
        }

        // Ensure each subgenre has a non-empty name
        for (let i = 0; i < subgenres.length; i++) {
            if (!subgenres[i].name.trim()) {
                setMessage(`Subgenre ${i + 1} benötigt einen Namen`);
                setLoading(false);
                return;
            }
        }

        try {
            const payload = { ...formData, subgenres };
            const res = await fetch('http://localhost:4000/create-genre', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Genre "${data.genre.name}" erstellt`);
                setFormData({ name: '' });
                setSubgenres([]);
            } else {
                setMessage(data.message || 'Fehler beim Erstellen des Genres');
            }
        } catch (err) {
            console.error(err);
            setMessage('Serverfehler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="registration-container"
            style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}
        >
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>
                Neues Genre erstellen
            </h1>

            {message && (
                <div
                    style={{
                        padding: '0.75rem',
                        backgroundColor: message.includes('erstellt')
                            ? '#d4edda'
                            : '#f8d7da',
                        color: message.includes('erstellt') ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                    }}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Genre Name */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="name"
                        style={{
                            display: 'block',
                            fontWeight: 'bold',
                            marginBottom: '.5rem',
                        }}
                    >
                        Genre Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                        }}
                    />
                </div>

                {/* Subgenres */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        style={{
                            display: 'block',
                            fontWeight: 'bold',
                            marginBottom: '.5rem',
                        }}
                    >
                        Subgenres hinzufügen
                    </label>

                    {subgenres.map((sg, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                marginBottom: '.5rem',
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Subgenre Name"
                                value={sg.name}
                                onChange={(e) => updateSubgenre(i, e.target.value)}
                                required
                                style={{
                                    flex: 1,
                                    padding: '.5rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeSubgenre(i)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#c00',
                                    fontSize: '1.25rem',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addSubgenre}
                        style={{
                            background: '#eee',
                            border: '1px solid #ccc',
                            padding: '.5rem',
                            borderRadius: '4px',
                        }}
                    >
                        + Subgenre hinzufügen
                    </button>
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
                        width: '100%',
                    }}
                >
                    {loading ? 'Bitte warten...' : 'Genre erstellen'}
                </button>
            </form>
        </div>
    );
}
