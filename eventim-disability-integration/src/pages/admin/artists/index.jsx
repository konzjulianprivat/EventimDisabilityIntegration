import React, { useEffect, useState } from 'react';

export default function ArtistsTooling() {
    const [artists, setArtists] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        name: '',
        biography: '',
        website: '',
        artist_image: null,
        existingImageId: null, // to keep track of the old image ID
    });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // 1) Alle Artists laden
    useEffect(() => {
        fetchArtists();
    }, []);

    const fetchArtists = async () => {
        try {
            const res = await fetch('http://localhost:4000/artists');
            const json = await res.json();
            // Beispiel: json = { artists: [ { id, name, biography, website, artist_image }, … ] }
            const dataArray = Array.isArray(json)
                ? json
                : Array.isArray(json.artists)
                    ? json.artists
                    : [];
            setArtists(dataArray);
        } catch (err) {
            console.error('Fehler beim Laden der Künstler:', err);
            setArtists([]);
        }
    };

    // 2) Bearbeiten-Modus ein- und ausschalten
    const handleEditToggle = (artist) => {
        setEditingId(artist.id);
        setEditedData({
            id: artist.id,
            name: artist.name || '',
            biography: artist.biography || '',
            website: artist.website || '',
            artist_image: null,              // wenn der User ein neues File auswählt, überschreibt das
            existingImageId: artist.artist_image || null,
        });
    };

    // 3) Eingabefelder updaten
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setEditedData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setEditedData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // 4) Änderungen speichern (PUT /artists/:id)
    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('name', editedData.name);
            formData.append('biography', editedData.biography);
            formData.append('website', editedData.website);

            // Wenn ein neues Bild gewählt wurde, hänge es an
            if (editedData.artist_image instanceof File) {
                formData.append('artist_image', editedData.artist_image);
            }

            const response = await fetch(
                `http://localhost:4000/artists/${editedData.id}`,
                {
                    method: 'PUT',
                    body: formData,
                }
            );
            if (!response.ok) {
                throw new Error('Server‐Fehler beim Speichern');
            }

            setEditingId(null);
            fetchArtists();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    // 5) Löschen (DELETE /artists/:id)
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:4000/artists/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Server‐Fehler beim Löschen');
            }
            setConfirmDeleteId(null);
            fetchArtists();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    return (
        <div className="admin-container">
            <div className="header-with-button">
                <h1 className="admin-heading">Admin-Artists-Tooling</h1>
                <a
                    href="/artists/create"
                    className="create-button"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Create
                </a>
            </div>

            {Array.isArray(artists) &&
                artists.map((artist) => (
                    <div className="artist-card-full" key={artist.id}>
                        <div className="artist-actions">
                            {editingId === artist.id ? (
                                <button
                                    className="circle-button green"
                                    onClick={handleSave}
                                    aria-label="Speichern"
                                />
                            ) : (
                                <button
                                    className="circle-button gray"
                                    onClick={() => handleEditToggle(artist)}
                                    aria-label="Bearbeiten"
                                />
                            )}
                            <button
                                className="circle-button red"
                                onClick={() => setConfirmDeleteId(artist.id)}
                                aria-label="Löschen"
                            />
                        </div>

                        <div className="artist-content">
                            {/* 6) Bild‐URL anzeigen: über /image/:id-Endpunkt */}
                            <img
                                src={
                                    editingId === artist.id &&
                                    editedData.artist_image instanceof File
                                        ? URL.createObjectURL(editedData.artist_image)
                                        : artist.artist_image
                                            ? `http://localhost:4000/image/${artist.artist_image}`
                                            : 'https://via.placeholder.com/150'
                                }
                                alt={artist.name || 'Unbekannter Künstler'}
                                className="artist-image"
                            />

                            <div className="artist-info">
                                {editingId === artist.id ? (
                                    <>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editedData.name}
                                            onChange={handleInputChange}
                                            placeholder="Name"
                                        />
                                        <textarea
                                            name="biography"
                                            value={editedData.biography}
                                            onChange={handleInputChange}
                                            placeholder="Biografie"
                                        />
                                        <input
                                            type="url"
                                            name="website"
                                            value={editedData.website}
                                            onChange={handleInputChange}
                                            placeholder="Website"
                                        />
                                        <input
                                            type="file"
                                            name="artist_image"
                                            onChange={handleInputChange}
                                            accept="image/*"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h2>{artist.name}</h2>
                                        <p>
                                            {artist.biography && artist.biography.trim() !== ''
                                                ? artist.biography
                                                : '— keine Biografie hinterlegt —'}
                                        </p>
                                        {artist.website && artist.website.trim() !== '' ? (
                                            <a
                                                href={artist.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {artist.website}
                                            </a>
                                        ) : (
                                            <span>— keine Website hinterlegt —</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {confirmDeleteId === artist.id && (
                            <div className="modal-overlay">
                                <div className="modal">
                                    <p>Möchtest du diesen Künstler wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button onClick={() => handleDelete(artist.id)}>
                                            Ja, löschen
                                        </button>
                                        <button onClick={() => setConfirmDeleteId(null)}>
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
}