// src/pages/admin/tours/create.jsx
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
        tourImage: null,
    });

    const [artists, setArtists] = useState([]);
    const [genres, setGenres] = useState([]);
    // Wir speichern Subgenres pro Genre-id in einem Objekt:
    //    { [genreId]: [ { id, name, genre_id }, … ] }
    const [subgenresByGenre, setSubgenresByGenre] = useState({});

    // Für die Tour-zuordnung, ein Array von “Blöcken”:
    //    [{ genreId: '', subgenreIds: ['','',…] }, …]
    const [tourGenres, setTourGenres] = useState([]);

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------------------------
    // 1) Beim Mount alle Künstler und Haupt-Genres einmal laden
    // ----------------------------------------------------------------------
    useEffect(() => {
        fetch('http://localhost:4000/artists')
            .then((res) => res.json())
            .then((data) => setArtists(data.artists))
            .catch((err) => console.error('Fehler beim Laden der Künstler:', err));

        fetch('http://localhost:4000/genres')
            .then((res) => res.json())
            .then((data) => setGenres(data.genres))
            .catch((err) => console.error('Fehler beim Laden der Genres:', err));
    }, []);


    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value,
        }));
    };

    // Genre-/Subgenre-Blöcke verwalten:
    const addGenreBlock = () => {
        setTourGenres((prev) => [...prev, { genreId: '', subgenreIds: [] }]);
    };

    const removeGenreBlock = (blockIndex) => {
        setTourGenres((prev) => prev.filter((_, idx) => idx !== blockIndex));
    };

    const updateGenreInBlock = async (blockIndex, newGenreId) => {
        // Wenn Genre gewechselt wird, Subgenres zurücksetzen
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === blockIndex
                    ? { genreId: newGenreId, subgenreIds: [] }
                    : blk
            )
        );

        // Nur dann Subgenres vom Server laden, wenn wir sie noch nicht haben
        if (newGenreId && !subgenresByGenre[newGenreId]) {
            try {
                const res = await fetch(
                    `http://localhost:4000/subgenres?genreId=${newGenreId}`
                );
                const data = await res.json();
                setSubgenresByGenre((prev) => ({
                    ...prev,
                    [newGenreId]: data.subgenres,
                }));
            } catch (err) {
                console.error(
                    `Fehler beim Laden der Subgenres für Genre ${newGenreId}:`,
                    err
                );
            }
        }
    };

    const addSubgenreToBlock = (blockIndex) => {
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === blockIndex
                    ? { ...blk, subgenreIds: [...blk.subgenreIds, ''] }
                    : blk
            )
        );
    };

    const updateSubgenreInBlock = (blockIndex, subIndex, newSubId) => {
        setTourGenres((prev) =>
            prev.map((blk, idx) => {
                if (idx === blockIndex) {
                    const newSubs = [...blk.subgenreIds];
                    newSubs[subIndex] = newSubId;
                    return { ...blk, subgenreIds: newSubs };
                }
                return blk;
            })
        );
    };

    const removeSubgenreFromBlock = (blockIndex, subIndex) => {
        setTourGenres((prev) =>
            prev.map((blk, idx) => {
                if (idx === blockIndex) {
                    const filtered = blk.subgenreIds.filter((_, sIdx) => sIdx !== subIndex);
                    return { ...blk, subgenreIds: filtered };
                }
                return blk;
            })
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (
            !formData.title.trim() ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.artistId
        ) {
            setMessage(
                'Titel, Startdatum, Enddatum und Künstler sind erforderlich'
            );
            setLoading(false);
            return;
        }

        // Genre/Subgenre Validierung:
        for (let i = 0; i < tourGenres.length; i++) {
            const { genreId, subgenreIds } = tourGenres[i];
            if (!genreId) {
                setMessage(`Genre ${i + 1} muss ausgewählt werden`);
                setLoading(false);
                return;
            }
            if (!Array.isArray(subgenreIds) || subgenreIds.length === 0) {
                setMessage(
                    `Für Genre ${i + 1} muss mindestens ein Subgenre angegeben sein`
                );
                setLoading(false);
                return;
            }
            for (let j = 0; j < subgenreIds.length; j++) {
                if (!subgenreIds[j]) {
                    setMessage(
                        `Subgenre ${j + 1} in Genre-Block ${i + 1} ist erforderlich`
                    );
                    setLoading(false);
                    return;
                }
                // Optional: Hier könnten wir serverseitig prüfen, ob subgenreIds[j]
                // wirklich zu genreId gehört (das Foreign Key in der DB übernimmt das
                // eigentlich ohnehin).
            }
        }

        // FormData zusammenpacken
        const fd = new FormData();
        fd.append('title', formData.title.trim());
        fd.append('description', formData.description || '');
        fd.append('startDate', formData.startDate);
        fd.append('endDate', formData.endDate);
        fd.append('artistId', formData.artistId);
        if (formData.tourImage) {
            fd.append('tourImage', formData.tourImage);
        }
        // Die tourGenres-Struktur als JSON-String mitsenden
        fd.append('genres', JSON.stringify(tourGenres));

        try {
            const res = await fetch('http://localhost:4000/create-tour', {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Tour „${data.tour.title}“ erstellt`);
                // Formular zurücksetzen
                setFormData({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    artistId: '',
                    tourImage: null,
                });
                setTourGenres([]);
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

    // ----------------------------------------------------------------------
    // 4) JSX Render-Teil
    // ----------------------------------------------------------------------
    return (
        <div
            className="registration-container"
            style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}
        >
            <h1 style={{ color: '#002b55', marginBottom: '1.5rem' }}>
                Neue Tour erstellen
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
                {/* === Titel === */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="title"
                        style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                    >
                        Titel *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
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

                {/* === Beschreibung === */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="description"
                        style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                    >
                        Beschreibung
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* === Start- & Enddatum === */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label
                            htmlFor="startDate"
                            style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                        >
                            Startdatum *
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
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
                    <div style={{ flex: 1 }}>
                        <label
                            htmlFor="endDate"
                            style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                        >
                            Enddatum *
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
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

                {/* === Künstler === */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="artistId"
                        style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                    >
                        Künstler *
                    </label>
                    <select
                        id="artistId"
                        name="artistId"
                        value={formData.artistId}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    >
                        <option value="">Bitte wählen</option>
                        {artists.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* === Tour-Bild === */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="tourImage"
                        style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
                    >
                        Tour-Bild hochladen
                    </label>
                    <input
                        type="file"
                        id="tourImage"
                        name="tourImage"
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                {/* === Genres & Subgenres === */}
                <div style={{ marginBottom: '2rem' }}>
                    <label
                        style={{
                            display: 'block',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Genres & Subgenres
                    </label>

                    {tourGenres.map((blk, i) => {
                        // Nur Subgenres für das aktuell gewählte Genre aus subgenresByGenre abrufen:
                        const optionsForThisGenre =
                            subgenresByGenre[blk.genreId] || [];

                        return (
                            <div
                                key={i}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <strong>Genre {i + 1}</strong>
                                    <button
                                        type="button"
                                        onClick={() => removeGenreBlock(i)}
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

                                {/* Hauptgenre-Auswahl */}
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <select
                                        value={blk.genreId}
                                        onChange={(e) =>
                                            updateGenreInBlock(i, e.target.value)
                                        }
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <option value="">Genre wählen</option>
                                        {genres.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subgenre-Liste (dynamisch) */}
                                {blk.subgenreIds.map((subId, subIdx) => (
                                    <div
                                        key={subIdx}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        <select
                                            value={subId}
                                            onChange={(e) =>
                                                updateSubgenreInBlock(i, subIdx, e.target.value)
                                            }
                                            required
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            <option value="">Subgenre wählen</option>
                                            {optionsForThisGenre.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => removeSubgenreFromBlock(i, subIdx)}
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
                                    onClick={() => addSubgenreToBlock(i)}
                                    disabled={!blk.genreId}
                                    style={{
                                        background: '#eee',
                                        border: '1px solid #ccc',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                    }}
                                >
                                    + Subgenre hinzufügen
                                </button>
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        onClick={addGenreBlock}
                        style={{
                            background: '#eee',
                            border: '1px solid #ccc',
                            padding: '0.5rem',
                            borderRadius: '4px',
                        }}
                    >
                        + Genre hinzufügen
                    </button>
                </div>

                {/* === Submit-Button === */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        backgroundColor: '#002b55',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                    }}
                >
                    {loading ? 'Bitte warten...' : 'Tour erstellen'}
                </button>
            </form>
        </div>
    );
}