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

    // Erweiterte Filter‐States
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

    // Optionen ableiten
    const categoryOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) =>
                ev.accessibility?.forEach((lbl) => s.add(lbl))
            )
        );
        return Array.from(s);
    }, [tours]);
    const venueOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) => ev.venueName && s.add(ev.venueName))
        );
        return Array.from(s);
    }, [tours]);
    const cityOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) => ev.cityName && s.add(ev.cityName))
        );
        return Array.from(s);
    }, [tours]);

    // ── Daten laden
    useEffect(() => {
        fetchTours();
        fetchAllArtists();
        fetchAllGenresWithSub();
    }, []);
    const fetchTours = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tours-detailed`);
            if (!res.ok) throw new Error();
            const json = await res.json();
            const arr = Array.isArray(json.tours) ? json.tours : [];
            setTours(arr);
            setBasicFilteredTours(arr);
            setFilteredTours(arr);
        } catch {
            setTours([]); setBasicFilteredTours([]); setFilteredTours([]);
        }
    };
    const fetchAllArtists = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/artists`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            const arr = Array.isArray(j)
                ? j
                : Array.isArray(j.artists)
                    ? j.artists
                    : [];
            setAllArtists(arr.map((a) => ({ id: a.id, name: a.name })));
        } catch {
            setAllArtists([]);
        }
    };
    const fetchAllGenresWithSub = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            setAllGenres(j.genres || []);
        } catch {
            setAllGenres([]);
        }
    };

    // ── Erweiterte Filter anwenden
    useEffect(() => {
        let resArr = basicFilteredTours;
        if (filterStartDate) {
            const s = new Date(filterStartDate);
            resArr = resArr.filter((t) => new Date(t.start_date) >= s);
        }
        if (filterEndDate) {
            const e = new Date(filterEndDate);
            resArr = resArr.filter((t) => new Date(t.end_date) <= e);
        }
        if (filterVenue) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) => ev.venueName === filterVenue)
            );
        }
        if (filterCity) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) => ev.cityName === filterCity)
            );
        }
        if (filterArtists.length) {
            resArr = resArr.filter((t) =>
                t.artistsList?.some((a) => filterArtists.includes(a))
            );
        }
        if (filterCategories.length) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) =>
                    ev.accessibility?.some((lbl) => filterCategories.includes(lbl))
                )
            );
        }
        setFilteredTours(resArr);
    }, [
        basicFilteredTours,
        filterStartDate,
        filterEndDate,
        filterVenue,
        filterCity,
        filterArtists,
        filterCategories,
    ]);

    // ── Edit / Save / Delete (unverändert) ───────────────────────────────────
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
        try {
            const [ra, rg] = await Promise.all([
                fetch(`${API_BASE_URL}/tour-artists?tourId=${tour.id}`),
                fetch(`${API_BASE_URL}/tour-genres?tourId=${tour.id}`)
            ]);
            const [ja, jg] = await Promise.all([ra.json(), rg.json()]);
            setTourArtists(ja.artists || []);
            setTourGenres(jg.tourGenres || []);
        } catch {
            setTourArtists([]); setTourGenres([]);
        }
    };
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) setEditedData((p) => ({ ...p, [name]: files[0] }));
        else setEditedData((p) => ({ ...p, [name]: value }));
    };
    const addArtistField = () => setTourArtists((p) => [...p, { id: '', name: '' }]);
    const updateArtistField = (i, id) => {
        const f = allArtists.find((a) => a.id === id) || { id: '', name: '' };
        setTourArtists((p) => p.map((x, idx) => (idx === i ? f : x)));
    };
    const removeArtistField = (i) => setTourArtists((p) => p.filter((_, idx) => idx !== i));
    const addGenreBlock = () => setTourGenres((p) => [...p, { genreId: '', genreName: '', subgenreIds: [] }]);
    const updateGenreSelect = (i, id) => {
        const f = allGenres.find((g) => g.id === id) || { id: '', name: '', subgenres: [] };
        setTourGenres((p) =>
            p.map((blk, idx) =>
                idx === i
                    ? { genreId: f.id, genreName: f.name, subgenreIds: [] }
                    : blk
            )
        );
    };
    const toggleSubgenreInBlock = (i, sid) =>
        setTourGenres((p) =>
            p.map((blk, idx) => {
                if (idx !== i) return blk;
                const has = blk.subgenreIds.includes(sid);
                return {
                    ...blk,
                    subgenreIds: has
                        ? blk.subgenreIds.filter((x) => x !== sid)
                        : [...blk.subgenreIds, sid],
                };
            })
        );
    const removeGenreBlock = (i) => setTourGenres((p) => p.filter((_, idx) => idx !== i));

    const handleSave = async () => {
        try {
            const fd = new FormData();
            fd.append('title', editedData.title);
            fd.append('subtitle', editedData.subtitle);
            fd.append('startDate', editedData.startDate);
            fd.append('endDate', editedData.endDate);
            if (editedData.tour_image instanceof File) {
                fd.append('tour_image', editedData.tour_image);
            }
            const aid = tourArtists.map((a) => a.id).filter(Boolean);
            fd.append('artistsJson', JSON.stringify(aid));
            const gsend = tourGenres
                .filter((b) => b.genreId)
                .map((b) => ({ genreId: b.genreId, subgenreIds: b.subgenreIds }));
            fd.append('genresJson', JSON.stringify(gsend));

            const r = await fetch(`${API_BASE_URL}/tours/${editedData.id}`, {
                method: 'PUT',
                body: fd,
            });
            if (!r.ok) throw new Error();
            setEditingId(null);
            fetchTours();
        } catch {
            console.error('Speichern fehlgeschlagen');
        }
    };

    const handleDelete = async (id) => {
        try {
            const r = await fetch(`${API_BASE_URL}/tours/${id}`, { method: 'DELETE' });
            if (!r.ok) throw new Error();
            setConfirmDeleteId(null);
            fetchTours();
        } catch {
            console.error('Löschen fehlgeschlagen');
        }
    };

    return (
        <div className="artists-wrapper">
            {/* Header + Create */}
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Touren</h2>
                <button
                    className="btn-create-entity"
                    onClick={() => router.push(`/admin/tours/create`)}
                >
                    + Tour erstellen
                </button>
            </div>

            {/* Filter */}
            <div className="filter-container">
                <FilterBar
                    items={tours}
                    onFiltered={setBasicFilteredTours}
                    entityName="Tour"
                    entityRoute="tours"
                    filterFields={filterFields}
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
                    artistOptions={allArtists.map((a) => a.name)}
                />
            </div>

            {/* Tour Cards */}
            <div className="tours-grid">
                {filteredTours.length === 0 && (
                    <div className="no-artists">Keine Touren vorhanden.</div>
                )}

                {filteredTours.map((tour) => {
                    // Primary artist for link
                    const artId = tour.artistIds?.[0] ?? '';
                    const tourUrl = `/artists/${artId}/${tour.id}`;
                    // Gather tour-level accessibility
                    const tourAccess = Array.from(
                        new Set(
                            (tour.events || []).flatMap((ev) => ev.accessibility || [])
                        )
                    );

                    return (
                        <div className="artist-card" key={tour.id}>
                            {/* Edit header */}
                            {editingId === tour.id && (
                                <div className="card-header">
                                    <input
                                        type="text"
                                        name="title"
                                        value={editedData.title}
                                        onChange={handleInputChange}
                                        className="input-name"
                                        placeholder="Titel"
                                    />
                                    <button
                                        className="btn-save"
                                        onClick={handleSave}
                                        title="Speichern"
                                    >
                                        💾
                                    </button>
                                </div>
                            )}

                            <div className="card-body">
                                {/* Single square poster, flush left */}
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

                                <div className="details-wrapper">
                                    {editingId === tour.id ? (
                                        /* ——— EDIT MODE FORM ——— */
                                        <>
                                            {/* subtitle */}
                                            <input
                                                type="text"
                                                name="subtitle"
                                                value={editedData.subtitle}
                                                onChange={handleInputChange}
                                                className="input-website"
                                                placeholder="Subtitle"
                                            />

                                            {/* dates */}
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

                                            {/* replace image */}
                                            <input
                                                type="file"
                                                name="tour_image"
                                                onChange={handleInputChange}
                                                accept="image/*"
                                                className="input-file"
                                            />

                                            {/* artists */}
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

                                            {/* genres */}
                                            <div className="section-block">
                        <span className="section-label">
                          Genres & Subgenres
                        </span>
                                                <br />
                                                {tourGenres.map((blk, idx) => {
                                                    const chosen = allGenres.find(
                                                        (g) => g.id === blk.genreId
                                                    );
                                                    const subs = chosen?.subgenres || [];
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
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                            {subs.length > 0 && blk.genreId && (
                                                                <div className="subgenre-checkboxes">
                                                                    {subs.map((s) => (
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

                                            {/* + Event */}
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
                                        /* ——— DISPLAY MODE ——— */
                                        <>
                                            {/* TOUR INFO (clickable) */}
                                            <div
                                                className="tour-header hoverable"
                                                onClick={() => router.push(tourUrl)}
                                            >
                                                <div>
                                                    <h3 className="tour-title">{tour.title}</h3>
                                                    {tour.subtitle && (
                                                        <p className="tour-subtitle">{tour.subtitle}</p>
                                                    )}
                                                    <div className="tour-meta">
                            <span>
                              {new Date(tour.start_date).toLocaleDateString(
                                  'de-DE'
                              )}{' '}
                                –{' '}
                                {new Date(tour.end_date).toLocaleDateString(
                                    'de-DE'
                                )}
                            </span>
                                                        <span>• {tour.eventCount} Events</span>
                                                    </div>
                                                    {tourAccess.length > 0 && (
                                                        <div className="tour-accessibility">
                                                            {tourAccess.map((lbl) => (
                                                                <span
                                                                    key={lbl}
                                                                    className="access-label-small"
                                                                >
                                  {lbl}
                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="header-right">
                                                    <div className="price">
                                                        ab €{' '}
                                                        {tour.cheapestPrice != null
                                                            ? tour.cheapestPrice.toFixed(2)
                                                            : '–'}
                                                    </div>
                                                    <button
                                                        className="btn-view-events"
                                                        onClick={() => router.push(tourUrl)}
                                                    >
                                                        Alle {tour.eventCount} Events anzeigen
                                                    </button>
                                                </div>
                                            </div>

                                            {/* FIRST TWO EVENTS */}
                                            <div className="sub-events">
                                                {(tour.events || [])
                                                    .slice(0, 2)
                                                    .map((ev) => {
                                                        const dt = new Date(ev.start_time);
                                                        const ds = dt.toLocaleDateString('de-DE', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        });
                                                        const ts = dt.toLocaleTimeString('de-DE', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        });
                                                        const evAcc = Array.from(
                                                            new Set(ev.accessibility || [])
                                                        );
                                                        const evUrl = `/artists/${artId}/${tour.id}/${ev.id}`;

                                                        return (
                                                            <div
                                                                key={ev.id}
                                                                className="sub-event-row hoverable"
                                                                onClick={() => router.push(evUrl)}
                                                            >
                                                                <div className="sub-event-info">
                                                                    <div className="sub-event-details">
                                                                        {ev.cityName}, {ds}, {ts}
                                                                    </div>
                                                                    <div className="sub-event-arena">
                                                                        {ev.venueName}
                                                                    </div>
                                                                    {evAcc.length > 0 && (
                                                                        <div className="sub-event-accessibility">
                                                                            {evAcc.map((lbl) => (
                                                                                <span
                                                                                    key={lbl}
                                                                                    className="access-label-small"
                                                                                >
                                          {lbl}
                                        </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    className="btn-tickets"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push(evUrl);
                                                                    }}
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

                            {/* Edit + Delete icons */}
                            {editingId !== tour.id && (
                                <div className="card-footer-icons">
                                    <button
                                        className="btn-edit small-edit"
                                        onClick={() => handleEditToggle(tour)}
                                        title="Bearbeiten"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="btn-edit delete-icon"
                                        onClick={() => setConfirmDeleteId(tour.id)}
                                        title="Löschen"
                                    >
                                        🗑
                                    </button>
                                </div>
                            )}

                            {/* Delete modal */}
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
                    );
                })}
            </div>
        </div>
    );
}