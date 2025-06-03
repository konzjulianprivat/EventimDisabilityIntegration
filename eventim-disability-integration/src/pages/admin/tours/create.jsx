// src/pages/admin/tours/create.jsx
"use client";

import React, { useState, useEffect } from "react";

export default function TourCreation() {
    // --------------------------------------------------
    // 1) State
    // --------------------------------------------------
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        tourImage: null,
    });

    // Array von ausgewählten Künstler-IDs (strings), z.B. ["uuid1", "uuid2", …]
    const [tourArtists, setTourArtists] = useState([]);

    const [artists, setArtists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [subgenresByGenre, setSubgenresByGenre] = useState({});
    const [tourGenres, setTourGenres] = useState([]);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // --------------------------------------------------
    // 2) Hook: Künstler & Genres laden
    // --------------------------------------------------
    useEffect(() => {
        fetch("http://localhost:4000/artists")
            .then((res) => res.json())
            .then((data) => setArtists(data.artists))
            .catch((err) => console.error("Fehler beim Laden der Künstler:", err));

        fetch("http://localhost:4000/genres")
            .then((res) => res.json())
            .then((data) => setGenres(data.genres))
            .catch((err) => console.error("Fehler beim Laden der Genres:", err));
    }, []);

    // --------------------------------------------------
    // 3) Helper-Funktionen
    // --------------------------------------------------
    // Einfacher onChange-Handler für Title, Description, Start-/Enddatum, Image
    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        if (type === "file") {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Künstler-Blocks verwalten:
    const addArtistBlock = () => {
        setTourArtists((prev) => [...prev, ""]); // neuer leerer Eintrag
    };

    const removeArtistBlock = (index) => {
        setTourArtists((prev) => prev.filter((_, idx) => idx !== index));
    };

    const updateArtistInBlock = (index, newArtistId) => {
        setTourArtists((prev) =>
            prev.map((aid, idx) => (idx === index ? newArtistId : aid))
        );
    };

    // Genre-/Subgenre-Logik (unverändert von vorher):
    const addGenreBlock = () => {
        setTourGenres((prev) => [...prev, { genreId: "", subgenreIds: [] }]);
    };

    const removeGenreBlock = (blockIndex) => {
        setTourGenres((prev) => prev.filter((_, idx) => idx !== blockIndex));
    };

    const updateGenreInBlock = async (blockIndex, newGenreId) => {
        setTourGenres((prev) =>
            prev.map((blk, idx) =>
                idx === blockIndex
                    ? { genreId: newGenreId, subgenreIds: [] }
                    : blk
            )
        );

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
                    ? { ...blk, subgenreIds: [...blk.subgenreIds, ""] }
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

    // --------------------------------------------------
    // 4) Submit-Handler
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        // Pflichtprüfungen:
        if (
            !formData.title.trim() ||
            !formData.startDate ||
            !formData.endDate ||
            tourArtists.length === 0 ||
            tourArtists.some((aid) => !aid)
        ) {
            setMessage(
                "Titel, Startdatum, Enddatum und mindestens ein ausgewählter Künstler sind erforderlich"
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
            }
        }

        //  FormData zusammenbauen:
        const fd = new FormData();
        fd.append("title", formData.title.trim());
        fd.append("description", formData.description || "");
        fd.append("startDate", formData.startDate);
        fd.append("endDate", formData.endDate);
        // Künstler-IDs als JSON-String übertragen
        fd.append("artistIdsJson", JSON.stringify(tourArtists));
        if (formData.tourImage) {
            fd.append("tourImage", formData.tourImage);
        }
        fd.append("genres", JSON.stringify(tourGenres));

        try {
            const res = await fetch("http://localhost:4000/create-tour", {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Tour „${data.tour.title}“ erstellt`);
                // Formular zurücksetzen
                setFormData({
                    title: "",
                    description: "",
                    startDate: "",
                    endDate: "",
                    tourImage: null,
                });
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

    // --------------------------------------------------
    // 5) JSX-Render
    // --------------------------------------------------
    return (
        <div
            className="registration-container"
            style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}
        >
            <h1 style={{ color: "#002b55", marginBottom: "1.5rem" }}>
                Neue Tour erstellen
            </h1>

            {message && (
                <div
                    style={{
                        padding: "0.75rem",
                        backgroundColor: message.includes("erstellt") ? "#d4edda" : "#f8d7da",
                        color: message.includes("erstellt") ? "#155724" : "#721c24",
                        borderRadius: "4px",
                        marginBottom: "1rem",
                    }}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* === Titel === */}
                <div style={{ marginBottom: "1rem" }}>
                    <label
                        htmlFor="title"
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
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
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                </div>

                {/* === Beschreibung === */}
                <div style={{ marginBottom: "1rem" }}>
                    <label
                        htmlFor="description"
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
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
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                </div>

                {/* === Start- & Enddatum === */}
                <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                        <label
                            htmlFor="startDate"
                            style={{
                                display: "block",
                                fontWeight: "bold",
                                marginBottom: "0.5rem",
                            }}
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
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label
                            htmlFor="endDate"
                            style={{
                                display: "block",
                                fontWeight: "bold",
                                marginBottom: "0.5rem",
                            }}
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
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                            }}
                        />
                    </div>
                </div>

                {/* === Künstler hinzufügen === */}
                <div style={{ marginBottom: "1rem" }}>
                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Künstler hinzufügen
                    </label>
                    {tourArtists.map((artistId, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "0.75rem",
                            }}
                        >
                            <select
                                value={artistId}
                                onChange={(e) => updateArtistInBlock(idx, e.target.value)}
                                required
                                style={{
                                    flex: 1,
                                    padding: "0.5rem",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            >
                                <option value="">Künstler wählen</option>
                                {artists.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeArtistBlock(idx)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#c00",
                                    fontSize: "1.25rem",
                                    cursor: "pointer",
                                }}
                                aria-label="Künstler entfernen"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addArtistBlock}
                        style={{
                            background: "#eee",
                            border: "1px solid #ccc",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        + Künstler hinzufügen
                    </button>
                </div>

                {/* === Tour-Bild hochladen === */}
                <div style={{ marginBottom: "1rem" }}>
                    <label
                        htmlFor="tourImage"
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Tour-Bild hochladen
                    </label>
                    <input
                        type="file"
                        id="tourImage"
                        name="tourImage"
                        accept="image/*"
                        onChange={handleChange}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                </div>

                {/* === Genres & Subgenres === */}
                <div style={{ marginBottom: "2rem" }}>
                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Genres & Subgenres
                    </label>

                    {tourGenres.map((blk, i) => {
                        const optionsForThisGenre = subgenresByGenre[blk.genreId] || [];
                        return (
                            <div
                                key={i}
                                style={{
                                    marginBottom: "1rem",
                                    padding: "1rem",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <strong>Genre {i + 1}</strong>
                                    <button
                                        type="button"
                                        onClick={() => removeGenreBlock(i)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#c00",
                                            fontSize: "1.25rem",
                                            cursor: "pointer",
                                        }}
                                        aria-label="Genre entfernen"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div style={{ marginBottom: "0.75rem" }}>
                                    <select
                                        value={blk.genreId}
                                        onChange={(e) => updateGenreInBlock(i, e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
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

                                {blk.subgenreIds.map((subId, subIdx) => (
                                    <div
                                        key={subIdx}
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            marginBottom: "0.5rem",
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
                                                padding: "0.5rem",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
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
                                                background: "transparent",
                                                border: "none",
                                                color: "#c00",
                                                fontSize: "1.25rem",
                                                cursor: "pointer",
                                            }}
                                            aria-label="Subgenre entfernen"
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
                                        background: "#eee",
                                        border: "1px solid #ccc",
                                        padding: "0.5rem",
                                        borderRadius: "4px",
                                        cursor: blk.genreId ? "pointer" : "not-allowed",
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
                            background: "#eee",
                            border: "1px solid #ccc",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            cursor: "pointer",
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
                        backgroundColor: "#002b55",
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "100%",
                    }}
                >
                    {loading ? "Bitte warten..." : "Tour erstellen"}
                </button>
            </form>
        </div>
    );
}