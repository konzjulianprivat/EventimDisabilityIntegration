// src/pages/admin/tours/create.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useValidation } from '../../../hooks/useValidation';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { useRouter } from 'next/navigation';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';

export default function TourCreation() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        tourImage: null,
    });

    const [tourArtists, setTourArtists] = useState([]);
    const [artists, setArtists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [subgenresByGenre, setSubgenresByGenre] = useState({});
    const [tourGenres, setTourGenres] = useState([]);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const validation = useValidation({ title: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetch("http://localhost:4000/artists", { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => setArtists(data.artists))
            .catch((err) => console.error("Fehler beim Laden der Künstler:", err));

        fetch("http://localhost:4000/genres", { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => setGenres(data.genres))
            .catch((err) => console.error("Fehler beim Laden der Genres:", err));
    }, []);

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        if (type === "file") {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
            if (name === 'title') validation.validate('title', value, { required: true });
            if (name === 'startDate') validation.validate('startDate', value, { required: true });
            if (name === 'endDate') validation.validate('endDate', value, { required: true });
        }
    };

    const addArtistBlock = () => setTourArtists((prev) => [...prev, ""]);
    const removeArtistBlock = (i) => setTourArtists((prev) => prev.filter((_, idx) => idx !== i));
    const updateArtistInBlock = (i, id) =>
        setTourArtists((prev) => prev.map((aid, idx) => (idx === i ? id : aid)));

    const addGenreBlock = () => setTourGenres((prev) => [...prev, { genreId: "", subgenreIds: [] }]);
    const removeGenreBlock = (i) => setTourGenres((prev) => prev.filter((_, idx) => idx !== i));
    const updateGenreInBlock = async (i, gid) => {
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === i ? { genreId: gid, subgenreIds: [] } : blk
            )
        );
        if (gid && !subgenresByGenre[gid]) {
            try {
                const res = await fetch(`http://localhost:4000/subgenres?genreId=${gid}`, {
                    credentials: 'include',
                });
                const data = await res.json();
                setSubgenresByGenre((p) => ({ ...p, [gid]: data.subgenres }));
            } catch (err) {
                console.error(`Fehler beim Laden der Subgenres für Genre ${gid}:`, err);
            }
        }
    };
    const addSubgenreToBlock = (i) =>
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === i ? { ...blk, subgenreIds: [...blk.subgenreIds, ""] } : blk
            )
        );
    const updateSubgenreInBlock = (bi, si, sid) =>
        setTourGenres((prev) =>
            prev.map((blk, idx) => {
                if (idx === bi) {
                    const subs = [...blk.subgenreIds];
                    subs[si] = sid;
                    return { ...blk, subgenreIds: subs };
                }
                return blk;
            })
        );
    const removeSubgenreFromBlock = (bi, si) =>
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === bi
                    ? { ...blk, subgenreIds: blk.subgenreIds.filter((_, j) => j !== si) }
                    : blk
            )
        );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (
            !validation.isValid() ||
            tourArtists.length === 0 ||
            tourArtists.some((aid) => !aid)
        ) {
            setMessage(
                "Titel, Startdatum, Enddatum und mindestens ein ausgewählter Künstler sind erforderlich"
            );
            setLoading(false);
            return;
        }

        for (let i = 0; i < tourGenres.length; i++) {
            const { genreId, subgenreIds } = tourGenres[i];
            if (!genreId) {
                setMessage(`Genre ${i + 1} muss ausgewählt werden`);
                setLoading(false);
                return;
            }
            if (!subgenreIds.length) {
                setMessage(`Für Genre ${i + 1} muss mindestens ein Subgenre angegeben sein`);
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
            }
        }

        const fd = new FormData();
        fd.append("title", formData.title.trim());
        fd.append("description", formData.description || "");
        fd.append("startDate", formData.startDate);
        fd.append("endDate", formData.endDate);
        fd.append("artistIdsJson", JSON.stringify(tourArtists));
        if (formData.tourImage) fd.append("tourImage", formData.tourImage);
        fd.append("genres", JSON.stringify(tourGenres));

        try {
            const res = await fetch("http://localhost:4000/create-tour", {
                method: "POST",
                body: fd,
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Tour „${data.tour.title}“ erstellt`);
                setFormData({ title: "", description: "", startDate: "", endDate: "", tourImage: null });
                setTourGenres([]);
                setTourArtists([]);
            } else {
                setMessage(data.message || "Fehler beim Erstellen der Tour");
            }
        } catch (err) {
            console.error("Create tour error:", err);
            setMessage("Serverfehler beim Erstellen der Tour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="artist-container">
            <h1>Neue Tour erstellen</h1>

            {message && (
                <div className={`message ${message.includes("erstellt") ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Titel */}
                <div className="form-group">
                    <label htmlFor="title" className="form-label">Titel *</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor('title', formData.title)}`}
                        required
                    />
                    {validation.errors.title && (
                        <div className="validation-msg">{validation.errors.title}</div>
                    )}
                </div>

                {/* Beschreibung */}
                <div className="form-group">
                    <label htmlFor="description" className="form-label">Beschreibung</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="form-textarea"
                    />
                </div>

                {/* Start- & Enddatum */}
                <div className="form-group form-row">
                    <div className="form-group">
                        <label htmlFor="startDate" className="form-label">Startdatum *</label>
                        <input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            className={`form-input ${validation.classFor('startDate', formData.startDate)}`}
                            required
                        />
                        {validation.errors.startDate && (
                            <div className="validation-msg">{validation.errors.startDate}</div>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="endDate" className="form-label">Enddatum *</label>
                        <input
                            id="endDate"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                            className={`form-input ${validation.classFor('endDate', formData.endDate)}`}
                            required
                        />
                        {validation.errors.endDate && (
                            <div className="validation-msg">{validation.errors.endDate}</div>
                        )}
                    </div>
                </div>

                {/* Künstler */}
                <div className="form-group">
                    <label className="form-label">Künstler hinzufügen</label>
                    {tourArtists.map((aid, idx) => (
                        <div key={idx} className="form-row">
                            <select
                                value={aid}
                                onChange={(e) => updateArtistInBlock(idx, e.target.value)}
                                required
                                className="form-select"
                            >
                                <option value="">Künstler wählen</option>
                                {artists.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeArtistBlock(idx)}
                                className="btn-remove"
                                aria-label="Künstler entfernen"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addArtistBlock} className="btn-inline">
                        + Künstler hinzufügen
                    </button>
                </div>

                {/* Tour-Bild */}
                <div className="form-group">
                    <label htmlFor="tourImage" className="form-label">Tour-Bild hochladen</label>
                    <input
                        id="tourImage"
                        name="tourImage"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="form-file-input"
                    />
                </div>

                {/* Genres & Subgenres */}
                <div className="form-group">
                    <label className="form-label">Genres & Subgenres</label>
                    {tourGenres.map((blk, i) => {
                        const opts = subgenresByGenre[blk.genreId] || [];
                        return (
                            <div key={i} className="genre-block">
                                <div className="form-row">
                                    <strong>Genre {i + 1}</strong>
                                    <button type="button" onClick={() => removeGenreBlock(i)} className="btn-remove" aria-label="Genre entfernen">✕</button>
                                </div>
                                <div className="form-group">
                                    <select
                                        value={blk.genreId}
                                        onChange={(e) => updateGenreInBlock(i, e.target.value)}
                                        required
                                        className="form-select"
                                    >
                                        <option value="">Genre wählen</option>
                                        {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                {blk.subgenreIds.map((subId, si) => (
                                    <div key={si} className="form-row">
                                        <select
                                            value={subId}
                                            onChange={(e) => updateSubgenreInBlock(i, si, e.target.value)}
                                            required
                                            className="form-select"
                                        >
                                            <option value="">Subgenre wählen</option>
                                            {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => removeSubgenreFromBlock(i, si)} className="btn-remove" aria-label="Subgenre entfernen">✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addSubgenreToBlock(i)} disabled={!blk.genreId} className="btn-inline">
                                    + Subgenre hinzufügen
                                </button>
                            </div>
                        );
                    })}
                    <button type="button" onClick={addGenreBlock} className="btn-inline">
                        + Genre hinzufügen
                    </button>
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <button type="button" onClick={() => router.back()} className="button button-back">Zurück</button>
                    <button type="submit" disabled={loading || !validation.isValid()} className="button button-submit">
                        {loading ? 'Bitte warten...' : 'Tour erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}
