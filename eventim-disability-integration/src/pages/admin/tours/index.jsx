// pages/admin/tours/index.jsx

import React, { useEffect, useState } from 'react';
import FilterBar from '../../../components/filter-bar';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../config';

export default function ToursContent() {
    const [tours, setTours] = useState([]);
    const [basicFilteredTours, setBasicFilteredTours] = useState([]);
    const [filteredTours, setFilteredTours] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        tour_image: null,
        existingImageId: null,
    });

    const [allArtists, setAllArtists] = useState([]);
    const [allGenres, setAllGenres] = useState([]);

    const [tourArtists, setTourArtists] = useState([]);
    const [tourGenres, setTourGenres] = useState([]);

    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // ──────────
    // Erweiterte Filter‐States (wurden zuvor direkt in index.jsx)
    // ──────────
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterVenue, setFilterVenue] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterArtists, setFilterArtists] = useState([]);

    const router = useRouter();

    const filterFields = [
        { key: 'title', label: 'Titel', match: 'startsWith' },
        { key: 'subtitle', label: 'Subtitle', match: 'contains' },
        { key: 'start_date', label: 'Startdatum', match: 'equals' },
        { key: 'end_date', label: 'Enddatum', match: 'equals' },
    ];

    // Optionen für erweiterte Filter aus geladenen Tours ableiten
    const categoryOptions = React.useMemo(() => {
        const set = new Set();
        tours.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (Array.isArray(ev.accessibility)) {
                        ev.accessibility.forEach((lbl) => set.add(lbl));
                    }
                });
            }
        });
        return Array.from(set);
    }, [tours]);

    const venueOptions = React.useMemo(() => {
        const set = new Set();
        tours.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (ev.venueName) set.add(ev.venueName);
                });
            }
        });
        return Array.from(set);
    }, [tours]);

    const cityOptions = React.useMemo(() => {
        const set = new Set();
        tours.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (ev.cityName) set.add(ev.cityName);
                });
            }
        });
        return Array.from(set);
    }, [tours]);

    useEffect(() => {
        fetchTours();
        fetchAllArtists();
        fetchAllGenresWithSub();
    }, []);

    // ──────────────────────────────────────────────────────────────────────────
    // 1) Tours laden
    // ──────────────────────────────────────────────────────────────────────────
    const fetchTours = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tours-detailed`);
            if (!res.ok) {
                console.error('fetchTours → status:', res.status);
                throw new Error('Fehler beim Abrufen von /tours-detailed');
            }
            const json = await res.json();
            const arr = Array.isArray(json.tours) ? json.tours : [];
            console.log('Gefundene Tours (fetched):', arr);
            setTours(arr);
            setBasicFilteredTours(arr);
            setFilteredTours(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Touren:', err);
            setTours([]);
            setBasicFilteredTours([]);
            setFilteredTours([]);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 2) Alle Künstler laden
    // ──────────────────────────────────────────────────────────────────────────
    const fetchAllArtists = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/artists`);
            if (!res.ok) {
                console.error('fetchArtists → status:', res.status);
                throw new Error('Fehler beim Abrufen von /artists');
            }
            const json = await res.json();
            const dataArray = Array.isArray(json)
                ? json
                : Array.isArray(json.artists)
                    ? json.artists
                    : [];
            setAllArtists(dataArray.map((a) => ({ id: a.id, name: a.name })));
        } catch (err) {
            console.error('Fehler beim Laden aller Künstler:', err);
            setAllArtists([]);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 3) Alle Genres mit Subgenres laden
    // ──────────────────────────────────────────────────────────────────────────
    const fetchAllGenresWithSub = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`);
            if (!res.ok) {
                console.error('fetchGenres → status:', res.status);
                throw new Error('Fehler beim Abrufen von /genres-with-subgenres');
            }
            const json = await res.json();
            setAllGenres(json.genres || []);
        } catch (err) {
            console.error('Fehler beim Laden aller Genres/Subgenres:', err);
            setAllGenres([]);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 4) Erweiterte Filter anwenden (jetzt basierend auf basicFilteredTours + Tour‐States)
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        let result = basicFilteredTours;
        if (filterStartDate) {
            const s = new Date(filterStartDate);
            result = result.filter((t) => new Date(t.start_date) >= s);
        }
        if (filterEndDate) {
            const e = new Date(filterEndDate);
            result = result.filter((t) => new Date(t.end_date) <= e);
        }
        if (filterVenue) {
            result = result.filter(
                (t) => Array.isArray(t.events) && t.events.some((ev) => ev.venueName === filterVenue)
            );
        }
        if (filterCity) {
            result = result.filter(
                (t) => Array.isArray(t.events) && t.events.some((ev) => ev.cityName === filterCity)
            );
        }
        if (filterArtists.length > 0) {
            result = result.filter(
                (t) => Array.isArray(t.artistsList) && t.artistsList.some((a) => filterArtists.includes(a))
            );
        }
        if (filterCategories.length > 0) {
            result = result.filter((t) =>
                Array.isArray(t.events) &&
                t.events.some(
                    (ev) =>
                        Array.isArray(ev.accessibility) &&
                        ev.accessibility.some((lbl) => filterCategories.includes(lbl))
                )
            );
        }
        setFilteredTours(result);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        basicFilteredTours,
        filterStartDate,
        filterEndDate,
        filterVenue,
        filterCity,
        filterArtists,
        filterCategories,
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 5) Wenn man auf „Bearbeiten“ klickt: Tour-Daten (inkl. Künstler + Genres) holen
    // ──────────────────────────────────────────────────────────────────────────
    const handleEditToggle = async (tour) => {
        setEditingId(tour.id);
        setEditedData({
            id: tour.id,
            title: tour.title || '',
            subtitle: tour.subtitle || '',
            startDate: tour.start_date || '',
            endDate: tour.end_date || '',
            tour_image: null,
            existingImageId: tour.tour_image || null,
        });

        // Tour-Künstler laden
        try {
            const resA = await fetch(`${API_BASE_URL}/tour-artists?tourId=${tour.id}`);
            if (!resA.ok) throw new Error('fetchTourArtists failed: ' + resA.status);
            const jsonA = await resA.json();
            setTourArtists(jsonA.artists || []);
        } catch (err) {
            console.error('Fehler beim Laden der Tour-Künstler:', err);
            setTourArtists([]);
        }

        // Tour-Genres laden
        try {
            const resG = await fetch(`${API_BASE_URL}/tour-genres?tourId=${tour.id}`);
            if (!resG.ok) throw new Error('fetchTourGenres failed: ' + resG.status);
            const jsonG = await resG.json();
            setTourGenres(jsonG.tourGenres || []);
        } catch (err) {
            console.error('Fehler beim Laden der Tour-Genres:', err);
            setTourGenres([]);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 6) Eingabefelder (Titel, Subtitle, Datum, Bild, Künstler, Genres) verwalten
    // ──────────────────────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setEditedData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setEditedData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const addArtistField = () => {
        setTourArtists((prev) => [...prev, { id: '', name: '' }]);
    };
    const updateArtistField = (index, artistId) => {
        const chosen = allArtists.find((a) => a.id === artistId) || { id: '', name: '' };
        setTourArtists((prev) =>
            prev.map((item, i) => (i === index ? { id: chosen.id, name: chosen.name } : item))
        );
    };
    const removeArtistField = (index) => {
        setTourArtists((prev) => prev.filter((_, i) => i !== index));
    };

    const addGenreBlock = () => {
        setTourGenres((prev) => [...prev, { genreId: '', genreName: '', subgenreIds: [] }]);
    };
    const updateGenreSelect = (index, genreId) => {
        const chosen = allGenres.find((g) => g.id === genreId) || { id: '', name: '', subgenres: [] };
        setTourGenres((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { genreId: chosen.id, genreName: chosen.name, subgenreIds: [] }
                    : item
            )
        );
    };
    const toggleSubgenreInBlock = (blockIndex, subgenreId) => {
        setTourGenres((prev) =>
            prev.map((blk, i) => {
                if (i !== blockIndex) return blk;
                const already = blk.subgenreIds.includes(subgenreId);
                const newSubIDs = already
                    ? blk.subgenreIds.filter((s) => s !== subgenreId)
                    : [...blk.subgenreIds, subgenreId];
                return { ...blk, subgenreIds: newSubIDs };
            })
        );
    };
    const removeGenreBlock = (index) => {
        setTourGenres((prev) => prev.filter((_, i) => i !== index));
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 7) Speichern (PUT /tours/:id)
    // ──────────────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('title', editedData.title);
            formData.append('subtitle', editedData.subtitle);
            formData.append('startDate', editedData.startDate);
            formData.append('endDate', editedData.endDate);

            if (editedData.tour_image instanceof File) {
                formData.append('tour_image', editedData.tour_image);
            }

            const artistIds = tourArtists.map((a) => a.id).filter((id) => id);
            formData.append('artistsJson', JSON.stringify(artistIds));

            const genresToSend = tourGenres
                .filter((blk) => blk.genreId)
                .map((blk) => ({
                    genreId: blk.genreId,
                    subgenreIds: blk.subgenreIds,
                }));
            formData.append('genresJson', JSON.stringify(genresToSend));

            const response = await fetch(`${API_BASE_URL}/tours/${editedData.id}`, {
                method: 'PUT',
                body: formData,
            });
            if (!response.ok) {
                console.error('PUT /tours/:id → status:', response.status);
                throw new Error('Server-Fehler beim Speichern');
            }

            setEditingId(null);
            fetchTours();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 8) Löschen (DELETE /tours/:id)
    // ──────────────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tours/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                console.error('DELETE /tours/:id → status:', response.status);
                throw new Error('Server-Fehler beim Löschen');
            }
            setConfirmDeleteId(null);
            fetchTours();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 9) JSX: Karte pro Tour
    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="artists-wrapper">
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Touren</h2>
                <button
                    className="btn-create-entity"
                    onClick={() => router.push(`/admin/tours/create`)}
                >
                    + Tour erstellen
                </button>
            </div>

            <div className="filter-container">
                <FilterBar
                    items={tours}
                    onFiltered={(arr) => setBasicFilteredTours(arr)}
                    entityName="Tour"
                    entityRoute="tours"
                    filterFields={filterFields}

                    // ###############################
                    // NEU: alle "Tours‐spezifischen" Filter‐Props
                    // ###############################
                    filterStartDate={filterStartDate}
                    setFilterStartDate={setFilterStartDate}

                    filterEndDate={filterEndDate}
                    setFilterEndDate={setFilterEndDate}

                    filterCategories={filterCategories}
                    setFilterCategories={setFilterCategories}
                    categoryOptions={categoryOptions}

                    filterVenue={filterVenue}
                    setFilterVenue={setFilterVenue}
                    venueOptions={venueOptions}

                    filterCity={filterCity}
                    setFilterCity={setFilterCity}
                    cityOptions={cityOptions}

                    filterArtists={filterArtists}
                    setFilterArtists={setFilterArtists}
                    // artistOptions erwartet nur die Namen-Liste
                    artistOptions={allArtists.map((a) => a.name)}
                />
            </div>

            <div className="tours-grid">
                {filteredTours.length === 0 && (
                    <div className="no-artists">Keine Touren vorhanden.</div>
                )}

                {filteredTours.map((tour) => (
                    <div className="artist-card" key={tour.id}>
                        {/* -------------------------------
                           Card-Header: Titel + Bearbeiten/Speichern
                        ------------------------------- */}
                        <div className="card-header">
                            {editingId === tour.id ? (
                                <input
                                    type="text"
                                    name="title"
                                    value={editedData.title}
                                    onChange={handleInputChange}
                                    className="input-name"
                                    placeholder="Titel"
                                />
                            ) : (
                                <div className="title-subtitle">
                                    <h3 className="artist-name">{tour.title}</h3>
                                    {tour.subtitle && (
                                        <div className="subtitle">{tour.subtitle}</div>
                                    )}
                                </div>
                            )}

                            {editingId === tour.id ? (
                                <button
                                    className="btn-save"
                                    onClick={handleSave}
                                    title="Speichern"
                                >
                                    💾
                                </button>
                            ) : (
                                <button
                                    className="btn-edit"
                                    onClick={() => handleEditToggle(tour)}
                                    title="Bearbeiten"
                                >
                                    ✎
                                </button>
                            )}
                        </div>

                        {/* -----------------------------------------------
                           Card-Body: Bild + rechte Seite mit Infos
                        ----------------------------------------------- */}
                        <div className="card-body">
                            {/* Tour-Bild */}
                            <div className="image-wrapper tour-image-large">
                                <img
                                    className="artist-image"
                                    src={
                                        editingId === tour.id &&
                                        editedData.tour_image instanceof File
                                            ? URL.createObjectURL(editedData.tour_image)
                                            : tour.tour_image
                                                ? `${API_BASE_URL}/image/${tour.tour_image}`
                                                : '/placeholder-tour.png'
                                    }
                                    alt={tour.title || 'Unbekannte Tour'}
                                />
                            </div>

                            {/* Rechte Seite: Alle Tour-Infos */}
                            <div className="details-wrapper">
                                {editingId === tour.id ? (
                                    <>
                                        {/* 1) Bearbeitungsmodus: Subtitle */}
                                        <input
                                            type="text"
                                            name="subtitle"
                                            value={editedData.subtitle}
                                            onChange={handleInputChange}
                                            placeholder="Subtitle"
                                            className="input-website"
                                        />

                                        {/* 2) Bearbeitungsmodus: Start + Ende nebeneinander */}
                                        <div className="date-row">
                                            <label className="date-label">
                                                Start:
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={editedData.startDate}
                                                    onChange={handleInputChange}
                                                    className="input-date"
                                                />
                                            </label>
                                            <label className="date-label">
                                                Ende:
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={editedData.endDate}
                                                    onChange={handleInputChange}
                                                    className="input-date"
                                                />
                                            </label>
                                        </div>

                                        {/* 3) Bearbeitungsmodus: Neues Tour-Bild */}
                                        <input
                                            type="file"
                                            name="tour_image"
                                            onChange={handleInputChange}
                                            accept="image/*"
                                            className="input-file"
                                        />

                                        {/* 4) Bearbeitungsmodus: Künstler-Sektion */}
                                        <div className="section-block">
                                            <span className="section-label">
                                                Zugeordnete Künstler
                                            </span>
                                            <br />
                                            {tourArtists.map((a, idx) => (
                                                <div
                                                    key={idx}
                                                    className="inline-flex align-center gap-0_5rem artist-field"
                                                >
                                                    <select
                                                        value={a.id}
                                                        onChange={(e) =>
                                                            updateArtistField(idx, e.target.value)
                                                        }
                                                        className="input-website"
                                                    >
                                                        <option value="">— Künstler wählen —</option>
                                                        {allArtists.map((opt) => (
                                                            <option key={opt.id} value={opt.id}>
                                                                {opt.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArtistField(idx)}
                                                        className="btn-remove-field"
                                                        title="Entfernen"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addArtistField}
                                                className="btn-create-entity btn-small"
                                            >
                                                + Künstler hinzufügen
                                            </button>
                                        </div>

                                        {/* 5) Bearbeitungsmodus: Genres/Subgenres-Sektion */}
                                        <div className="section-block">
                                            <span className="section-label">
                                                Genres & Subgenres
                                            </span>
                                            <br />
                                            {tourGenres.map((blk, idx) => {
                                                const chosenGenre = allGenres.find(
                                                    (g) => g.id === blk.genreId
                                                );
                                                const availableSubs = chosenGenre
                                                    ? chosenGenre.subgenres
                                                    : [];
                                                return (
                                                    <div key={idx} className="genre-block">
                                                        <div className="inline-flex align-center gap-0_5rem">
                                                            <select
                                                                value={blk.genreId}
                                                                onChange={(e) =>
                                                                    updateGenreSelect(idx, e.target.value)
                                                                }
                                                                className="input-website"
                                                            >
                                                                <option value="">
                                                                    — Genre wählen —
                                                                </option>
                                                                {allGenres.map((g) => (
                                                                    <option key={g.id} value={g.id}>
                                                                        {g.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeGenreBlock(idx)}
                                                                className="btn-remove-field"
                                                                title="Entfernen"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        {availableSubs.length > 0 && blk.genreId && (
                                                            <div className="subgenre-checkboxes">
                                                                {availableSubs.map((s) => (
                                                                    <label
                                                                        key={s.id}
                                                                        className="checkbox-inline"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={blk.subgenreIds.includes(
                                                                                s.id
                                                                            )}
                                                                            onChange={() =>
                                                                                toggleSubgenreInBlock(
                                                                                    idx,
                                                                                    s.id
                                                                                )
                                                                            }
                                                                        />
                                                                        <span className="sub-name">
                                                                            {s.name}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={addGenreBlock}
                                                className="btn-create-entity btn-small"
                                            >
                                                + Genre hinzufügen
                                            </button>
                                        </div>

                                        {/* 6) Bearbeitungsmodus: "+ Event hinzufügen"-Button */}
                                        <div className="section-block">
                                            <button
                                                className="btn-create-entity btn-small"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/tours/events/create?tourId=${tour.id}`
                                                    )
                                                }
                                            >
                                                + Event hinzufügen
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* ================================
                                          ANZEIGEMODUS (nicht editieren)
                                        ================================ */}

                                        {/* 1) Zeile: Datum — Ende | X Events + Genres/Subgenres */}
                                        <div className="tour-info-row">
                                            <div className="tour-dates">
                                                {new Date(tour.start_date).toLocaleDateString(
                                                    'de-DE'
                                                )}{' '}
                                                —{' '}
                                                {new Date(tour.end_date).toLocaleDateString(
                                                    'de-DE'
                                                )}{' '}
                                                | {tour.eventCount} Events
                                            </div>
                                            <div className="tour-genres">
                                                {tour.genresWithSubs
                                                    .map((g) => {
                                                        if (
                                                            Array.isArray(g.subgenreNames) &&
                                                            g.subgenreNames.length > 0
                                                        ) {
                                                            return `${g.genreName} (${g.subgenreNames.join(
                                                                ', '
                                                            )})`;
                                                        } else {
                                                            return g.genreName;
                                                        }
                                                    })
                                                    .join(', ')}
                                            </div>
                                        </div>

                                        {/* 2) Künstlerliste, falls vorhanden */}
                                        {Array.isArray(tour.artistsList) &&
                                            tour.artistsList.length > 0 && (
                                                <div className="artists-list-row">
                                                    <span className="detail-label">
                                                        Künstler:
                                                    </span>{' '}
                                                    <span className="detail-value">
                                                        {tour.artistsList.join(', ')}
                                                    </span>
                                                </div>
                                            )}

                                        {/* 3) Preis + Button (Alle X Events anzeigen) */}
                                        <div className="price-button-row">
                                            {tour.cheapestPrice !== null ? (
                                                <div className="cheapest-price">
                                                    ab € {tour.cheapestPrice.toFixed(2)}
                                                </div>
                                            ) : (
                                                <div className="cheapest-price">–</div>
                                            )}
                                            <button
                                                className="btn-view-events"
                                                onClick={() =>
                                                    router.push(`/events/${tour.id}`)
                                                }
                                            >
                                                Alle {tour.eventCount} Events anzeigen
                                            </button>
                                        </div>

                                        {/* 4) Trennlinie */}
                                        <hr className="divider" />

                                        {/* 5) Event-Liste */}
                                        <div className="events-list">
                                            {Array.isArray(tour.events) &&
                                               (filterCategories.length > 0
                                                   ? tour.events.filter(ev =>
                                                               Array.isArray(ev.accessibility) &&
                                                               ev.accessibility.some(lbl => filterCategories.includes(lbl))
                                                             )
                                                       : tour.events
                                                   ).map((ev) => {
                                                    // Datum / Uhrzeit formatiert
                                                    const dateObj = new Date(ev.start_time);
                                                    const dateStr = dateObj.toLocaleDateString(
                                                        'de-DE',
                                                        {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        }
                                                    );
                                                    const timeStr = dateObj.toLocaleTimeString(
                                                        'de-DE',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }
                                                    );

                                                    return (
                                                        <div className="event-row" key={ev.id}>
                                                            {/* 1) City, Datum, Zeit */}
                                                            <div className="event-info">
                                                                {ev.cityName}, {dateStr}, {timeStr}
                                                            </div>

                                                            {/* 2) Arena-Name */}
                                                            <div className="event-arena">
                                                                {ev.venueName}
                                                            </div>

                                                            {/* 3) Tour-Name */}
                                                            <div className="event-title">
                                                                {tour.title}
                                                            </div>

                                                            {/* 4) Kleine Disability-Badges */}
                                                            <div className="event-accessibility">
                                                                {Array.isArray(ev.accessibility) &&
                                                                    [...new Set(ev.accessibility)].map((lbl) => (
                                                                        <span
                                                                            key={lbl}
                                                                            className="access-label-small"
                                                                        >
                                                                            {lbl}
                                                                        </span>
                                                                    ))}
                                                            </div>

                                                            {/* 5) Tickets-Button */}
                                                            <button
                                                                className="btn-tickets"
                                                                onClick={() =>
                                                                    router.push(`/events/${ev.id}`)
                                                                }
                                                            >
                                                                Tickets
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 10) Delete-Icon (nur, wenn nicht im Bearbeitungs-Modus) */}
                        {editingId !== tour.id && (
                            <button
                                className="btn-edit delete-icon"
                                onClick={() => setConfirmDeleteId(tour.id)}
                                title="Löschen"
                            >
                                🗑
                            </button>
                        )}

                        {/* 11) Modal: Bestätigung Löschen */}
                        {confirmDeleteId === tour.id && (
                            <div className="modal-overlay">
                                <div className="modal-box">
                                    <p>Möchtest du diese Tour wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button
                                            className="btn btn-confirm"
                                            onClick={() => handleDelete(tour.id)}
                                        >
                                            Ja, löschen
                                        </button>
                                        <button
                                            className="btn btn-cancel"
                                            onClick={() => setConfirmDeleteId(null)}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}