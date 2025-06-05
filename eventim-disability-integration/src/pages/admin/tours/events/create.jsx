// pages/events.jsx

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
    const [venueAreas, setVenueAreas] = useState([]);      // each: { id, name, max_capacity, is_disability_category }

    // “Normale” Kategorien
    const [categories, setCategories] = useState([]);

    // Disability‐Kategorie
    const [disabilityCategory, setDisabilityCategory] = useState({
        name: 'Kategorie für Menschen mit Behinderung',
        price: '',
        venueAreas: [] // gefüllt mit allen venueAreas, deren is_disability_category===true
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 1) Load tours, venues, artists
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

    // 2) When venueId changes, load all venueAreas (incl. is_disability_category)
    useEffect(() => {
        if (!formData.venueId) {
            setVenueAreas([]);
            setDisabilityCategory(dc => ({ ...dc, venueAreas: [] }));
            return;
        }
        fetch(`http://localhost:4000/venue-areas?venueId=${formData.venueId}`)
            .then(r => r.json())
            .then(d => {
                const allAreas = d.venueAreas || [];
                setVenueAreas(allAreas);

                // Filtere auf is_disability_category===true
                const onlyDisability = allAreas
                    .filter(va => va.is_disability_category)
                    .map(va => ({ areaId: va.id, capacity: '' }));

                setDisabilityCategory(dc => ({
                    ...dc,
                    venueAreas: onlyDisability
                }));
            })
            .catch(err => {
                console.error('Error loading venue areas', err);
                setVenueAreas([]);
                setDisabilityCategory(dc => ({ ...dc, venueAreas: [] }));
            });
    }, [formData.venueId]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    // 3) Artist‐Handler
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

    // 4) “Normale” Category‐Handler
    const addCategory = () => {
        const idx = categories.length + 1;
        setCategories(c => [
            ...c,
            {
                name: `Kategorie ${idx}`,
                price: '',
                venueAreas: []
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

    const removeAreaFromCategory = (catIndex, areaIndex) => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIndex) return cat;
                const newVenueAreas = cat.venueAreas.filter((_, aIdx) => aIdx !== areaIndex);
                return { ...cat, venueAreas: newVenueAreas };
            })
        );
    };

    // 5) Disability‐Kategorie: Preis und Kapazitäten editieren
    const updateDisabilityField = (field, val) => {
        setDisabilityCategory(dc => ({ ...dc, [field]: val }));
    };

    const updateDisabilityAreaCapacity = (areaIndex, val) => {
        setDisabilityCategory(dc => {
            const newVenueAreas = dc.venueAreas.map((entry, idx) => {
                if (idx !== areaIndex) return entry;
                return { ...entry, capacity: val };
            });
            return { ...dc, venueAreas: newVenueAreas };
        });
    };

    // 6) Hilfsfunktion: Gesamtkapazität summieren
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

        // 7) Validierung normale Kategorien
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

        // 8) Validierung Disability‐Kategorie (wenn überhaupt disabilityAreas)
        if (disabilityCategory.venueAreas.length > 0) {
            if (!disabilityCategory.price) {
                setMessage('Preis für “Kategorie für Menschen mit Behinderung” ist erforderlich');
                setLoading(false);
                return;
            }
            for (const entry of disabilityCategory.venueAreas) {
                if (!entry.capacity) {
                    setMessage('Kapazität in der Behinderten-Kategorie darf nicht leer sein');
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            // Baue komplettes categories‐Array inkl. disabilityCategory, falls vorhanden
            const allCats = [
                ...categories,
                ...(disabilityCategory.venueAreas.length > 0
                    ? [disabilityCategory]
                    : [])
            ];

            const payload = { ...formData, eventArtists, categories: allCats };
            const res = await fetch('http://localhost:4000/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Event erstellt`);
                setFormData({
                    tourId: '',
                    venueId: '',
                    doorTime: '',
                    startTime: '',
                    endTime: '',
                    description: ''
                });
                setEventArtists([]);
                setCategories([]);
                setDisabilityCategory(dc => ({ ...dc, price: '', venueAreas: [] }));
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

                {/* -------------------------------------------------- */}
                {/* Normale Kategorien */}
                {/* -------------------------------------------------- */}
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

                                {/* Name */}
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

                                {/* Preis */}
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
                                        marginBottom: '0.75rem'
                                    }}
                                />

                                {/* venueAreas‐Einträge */}
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
                                            {venueAreas
                                                .filter(va => !va.is_disability_category) // nur normale Bereiche
                                                .map(va => (
                                                <option key={va.id} value={va.id}>
                                                    {va.name} (max {va.max_capacity})
                                                </option>
                                            ))}
                                        </select>

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

                {/* -------------------------------------------------- */}
                {/* Kategorien für Menschen mit besonderen Bedürfnissen */}
                {/* -------------------------------------------------- */}
                {disabilityCategory.venueAreas.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '.5rem' }}>
                            Kategorien für Menschen mit besonderen Bedürfnissen
                        </label>

                        <div
                            style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        >
                            {/* Name (readonly) */}
                            <input
                                type="text"
                                value={disabilityCategory.name}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '.5rem',
                                    border: '1px solid #ccc',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px',
                                    marginBottom: '.5rem'
                                }}
                            />

                            {/* Preis */}
                            <input
                                type="number"
                                min="0"
                                placeholder="Preis"
                                value={disabilityCategory.price}
                                onChange={e => updateDisabilityField('price', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '.5rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    marginBottom: '0.75rem'
                                }}
                            />

                            {/* Für jede behinderten‐Area */}
                            {disabilityCategory.venueAreas.map((entry, idx) => {
                                const va = venueAreas.find(v => v.id === entry.areaId);
                                const areaName = va ? va.name : '';
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            marginBottom: '.5rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={areaName}
                                            disabled
                                            style={{
                                                flex: 1,
                                                padding: '.5rem',
                                                border: '1px solid #ccc',
                                                backgroundColor: '#f0f0f0',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Kapazität"
                                            value={entry.capacity}
                                            onChange={e => updateDisabilityAreaCapacity(idx, e.target.value)}
                                            style={{
                                                width: '25%',
                                                padding: '.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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