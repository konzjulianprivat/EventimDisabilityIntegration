import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        tourId: '',
        venueId: '',
        doorTime: '',
        startTime: '',
        endTime: '',
        description: ''
    });
    const [tours, setTours] = useState([]);
    const [venues, setVenues] = useState([]);
    const [artists, setArtists] = useState([]);
    const [eventArtists, setEventArtists] = useState([]); // [{ artistId }]
    const [venueAreas, setVenueAreas] = useState([]); // fetched based on venue

    // Now each category has: { name, price, venueAreas: [ { areaId, capacity } ] }
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Load tours, venues, artists on mount
    useEffect(() => {
        fetch('http://localhost:4000/tours')
            .then(r => r.json())
            .then(d => setTours(d.tours));

        fetch('http://localhost:4000/venues')
            .then(r => r.json())
            .then(d => setVenues(d.venues));

        fetch('http://localhost:4000/artists')
            .then(r => r.json())
            .then(d => setArtists(d.artists));
    }, []);

    // When venueId changes, load venueAreas for that venue
    useEffect(() => {
        if (!formData.venueId) {
            setVenueAreas([]);
            return;
        }
        fetch(`http://localhost:4000/venue-areas?venueId=${formData.venueId}`)
            .then(r => r.json())
            .then(d => setVenueAreas(d.venueAreas || []))
            .catch(err => {
                console.error('Error loading venue areas', err);
                setVenueAreas([]);
            });
    }, [formData.venueId]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    // --- Artist handlers (unchanged) ---
    const addArtist = () => {
        setEventArtists(ea => [...ea, { artistId: '' }]);
    };
    const updateArtist = (i, field, val) => {
        setEventArtists(ea =>
            ea.map((it, idx) => (idx === i ? { ...it, [field]: val } : it))
        );
    };
    const removeArtist = i => {
        setEventArtists(ea => ea.filter((_, idx) => idx !== i));
    };

    // --- Category handlers, updated to allow multiple venueAreas per category ---
    const addCategory = () => {
        const idx = categories.length + 1;
        setCategories(c => [
            ...c,
            {
                name: `Kategorie ${idx}`,
                price: '',
                venueAreas: [] // start with no selected areas
            }
        ]);
    };

    const updateCategoryField = (catIndex, field, val) => {
        setCategories(c =>
            c.map((it, idx) =>
                idx === catIndex ? { ...it, [field]: val } : it
            )
        );
    };

    const removeCategory = catIndex => {
        setCategories(c => c.filter((_, idx) => idx !== catIndex));
    };

    // Add a new (areaId, capacity) pair to a given category
    const addAreaToCategory = catIndex => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIndex) return cat;
                return {
                    ...cat,
                    venueAreas: [
                        ...cat.venueAreas,
                        { areaId: '', capacity: '' }
                    ]
                };
            })
        );
    };

    // Update a specific area entry inside a category
    const updateAreaInCategory = (catIndex, areaIndex, field, val) => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIndex) return cat;
                const newVenueAreas = cat.venueAreas.map((entry, aIdx) => {
                    if (aIdx !== areaIndex) return entry;
                    return { ...entry, [field]: val };
                });
                return { ...cat, venueAreas: newVenueAreas };
            })
        );
    };

    // Remove a specific area entry from a category
    const removeAreaFromCategory = (catIndex, areaIndex) => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIndex) return cat;
                const newVenueAreas = cat.venueAreas.filter((_, aIdx) => aIdx !== areaIndex);
                return { ...cat, venueAreas: newVenueAreas };
            })
        );
    };

    // Helper to compute total capacity for a given category (sum of all its venueAreas’ capacities)
    const getTotalCapacityForCategory = cat => {
        return cat.venueAreas.reduce((sum, entry) => {
            const cap = parseInt(entry.capacity, 10);
            return sum + (isNaN(cap) ? 0 : cap);
        }, 0);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const { tourId, venueId, doorTime, startTime, endTime } = formData;
        if (!tourId || !venueId || !doorTime || !startTime || !endTime) {
            setMessage('Tour, Venue und alle Zeiten sind erforderlich');
            setLoading(false);
            return;
        }
        // Validate each category: must have name, price, and at least one area entry, and each entry needs areaId+capacity
        for (const cat of categories) {
            if (!cat.name || !cat.price) {
                setMessage('Alle Kategorien benötigen Namen und Preis');
                setLoading(false);
                return;
            }
            if (cat.venueAreas.length === 0) {
                setMessage('Jede Kategorie muss mindestens einen Bereich haben');
                setLoading(false);
                return;
            }
            for (const entry of cat.venueAreas) {
                if (!entry.areaId || !entry.capacity) {
                    setMessage('Jede Bereichs‐Eintragung benötigt Bereichsauswahl und Kapazität');
                    setLoading(false);
                    return;
                }
            }
        }
        try {
            const payload = { ...formData, eventArtists, categories };
            const res = await fetch('http://localhost:4000/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Event erstellt`);
                setFormData({ tourId: '', venueId: '', doorTime: '', startTime: '', endTime: '', description: '' });
                setEventArtists([]);
                setCategories([]);
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
        <div className="registration-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>Neues Event erstellen</h1>

            {message && (
                <div
                    style={{
                        padding: '0.75rem',
                        backgroundColor: message.includes('erstellt') ? '#d4edda' : '#f8d7da',
                        color: message.includes('erstellt') ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ---------------- Tour ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Tour *</label>
                    <select
                        name="tourId"
                        value={formData.tourId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">Bitte wählen</option>
                        {tours.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.title || t.id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ---------------- Venue ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Venue *</label>
                    <select
                        name="venueId"
                        value={formData.venueId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">Bitte wählen</option>
                        {venues.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ---------------- Door Time ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Einlasszeit *</label>
                    <input
                        type="datetime-local"
                        name="doorTime"
                        value={formData.doorTime}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* ---------------- Start Time ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Beginn *</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* ---------------- End Time ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Ende *</label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* ---------------- Description ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Beschreibung</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        style={{ width: '100%', padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {/* ---------------- Artists ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Begleitungs-Acts hinzufügen</label>
                    {eventArtists.map((ea, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '.5rem' }}>
                            <select
                                value={ea.artistId}
                                onChange={e => updateArtist(i, 'artistId', e.target.value)}
                                required
                                style={{ flex: 2, padding: '.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="">Begleitungs-Acts wählen</option>
                                {artists.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeArtist(i)}
                                style={{ background: 'transparent', border: 'none', color: '#c00', fontSize: '1.25rem', cursor: 'pointer' }}
                                aria-label="Künstler entfernen"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addArtist}
                        style={{ background: '#eee', border: '1px solid #ccc', padding: '.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Künstler hinzufügen
                    </button>
                </div>

                {/* ---------------- Kategorien (mit mehreren venueAreas pro Kategorie) ---------------- */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>Kategorien</label>

                    {categories.map((cat, i) => {
                        const totalCapacity = getTotalCapacityForCategory(cat);
                        return (
                            <div
                                key={i}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    <strong>
                                        Kategorie {i + 1} – Gesamtkapazität: {totalCapacity}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(i)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#c00',
                                            fontSize: '1.25rem',
                                            cursor: 'pointer'
                                        }}
                                        aria-label="Kategorie entfernen"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Name der Kategorie */}
                                <input
                                    type="text"
                                    placeholder="Name der Kategorie"
                                    value={cat.name}
                                    onChange={e => updateCategoryField(i, 'name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        marginBottom: '.5rem'
                                    }}
                                />

                                {/* Preis der Kategorie */}
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Preis"
                                    value={cat.price}
                                    onChange={e => updateCategoryField(i, 'price', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        marginBottom: '.75rem'
                                    }}
                                />

                                {/* Für jede ausgewählte venueArea in dieser Kategorie: Bereich + Kapazität */}
                                {cat.venueAreas.map((entry, aIdx) => (
                                    <div
                                        key={aIdx}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            marginBottom: '.5rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Bereich wählen */}
                                        <select
                                            value={entry.areaId}
                                            onChange={e =>
                                                updateAreaInCategory(i, aIdx, 'areaId', e.target.value)
                                            }
                                            required
                                            style={{
                                                flex: 1,
                                                padding: '.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="">Bereich wählen</option>
                                            {venueAreas.map(va => (
                                                <option key={va.id} value={va.id}>
                                                    {va.name} (max {va.max_capacity})
                                                </option>
                                            ))}
                                        </select>

                                        {/* Kapazität für diesen Bereich innerhalb der Kategorie */}
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Kapazität"
                                            value={entry.capacity}
                                            onChange={e =>
                                                updateAreaInCategory(i, aIdx, 'capacity', e.target.value)
                                            }
                                            style={{
                                                width: '25%',
                                                padding: '.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px'
                                            }}
                                        />

                                        {/* Entfernen-Button für diese Bereichs-Eintragung */}
                                        <button
                                            type="button"
                                            onClick={() => removeAreaFromCategory(i, aIdx)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#c00',
                                                fontSize: '1.25rem',
                                                cursor: 'pointer'
                                            }}
                                            aria-label="Bereich entfernen"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* Button: + Bereich hinzufügen */}
                                <button
                                    type="button"
                                    onClick={() => addAreaToCategory(i)}
                                    disabled={!formData.venueId}
                                    style={{
                                        background: '#eee',
                                        border: '1px solid #ccc',
                                        padding: '.5rem',
                                        borderRadius: '4px',
                                        cursor: formData.venueId ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    + Bereich hinzufügen
                                </button>
                            </div>
                        );
                    })}

                    {/* Button: + Kategorie hinzufügen */}
                    <button
                        type="button"
                        onClick={addCategory}
                        style={{
                            background: '#eee',
                            border: '1px solid #ccc',
                            padding: '.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        + Kategorie hinzufügen
                    </button>
                </div>

                {/* ---------------- Submit ---------------- */}
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
                    {loading ? 'Bitte warten...' : 'Event erstellen'}
                </button>
            </form>
        </div>
    );
}