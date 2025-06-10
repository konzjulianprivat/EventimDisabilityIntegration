import React, { useEffect, useState } from 'react';
import FilterBar from '../../../components/filter-bar';
import { useRouter } from 'next/router';

export default function ArtistsContent() {
    const [artists, setArtists] = useState([]);
    const [filteredArtists, setFilteredArtists] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        name: '',
        biography: '',
        website: '',
        artist_image: null,
        existingImageId: null,
    });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());

    const router = useRouter();

    const filterFields = [
        { key: 'name', label: 'Name', match: 'startsWith' },
        { key: 'biography', label: 'Biografie', match: 'contains' },
        { key: 'website', label: 'Website', match: 'contains' },
    ];

    useEffect(() => {
        fetchArtists();
    }, []);

    const fetchArtists = async () => {
        try {
            const res = await fetch('http://localhost:4000/artists');
            const json = await res.json();
            const dataArray = Array.isArray(json)
                ? json
                : Array.isArray(json.artists)
                    ? json.artists
                    : [];

            setArtists(dataArray);
            setFilteredArtists(dataArray);
        } catch (err) {
            console.error('Fehler beim Laden der Künstler:', err);
            setArtists([]);
            setFilteredArtists([]);
        }
    };

    const handleEditToggle = (artist) => {
        setEditingId(artist.id);
        setEditedData({
            id: artist.id,
            name: artist.name || '',
            biography: artist.biography || '',
            website: artist.website || '',
            artist_image: null,
            existingImageId: artist.artist_image || null,
        });
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setEditedData((prev) => ({ ...prev, [name]: files[0] }));
        } else if (name === 'biography') {
            setEditedData((prev) => ({ ...prev, [name]: value }));
        } else {
            setEditedData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('name', editedData.name);
            formData.append('biography', editedData.biography);
            formData.append('website', editedData.website);

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
                throw new Error('Server-Fehler beim Speichern');
            }

            setEditingId(null);
            fetchArtists();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:4000/artists/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Server-Fehler beim Löschen');
            }
            setConfirmDeleteId(null);
            fetchArtists();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds((prev) => {
            const copy = new Set(prev);
            if (copy.has(id)) copy.delete(id);
            else copy.add(id);
            return copy;
        });
    };

    return (
        <div className="artists-wrapper">
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Künstler</h2>
                <button
                    className="btn-create-entity"
                    onClick={() => router.push(`/admin/artists/create`)}
                >
                    + Künstler erstellen
                </button>
            </div>

            <div className="filter-container">
                <FilterBar
                    items={artists}
                    onFiltered={(arr) => setFilteredArtists(arr)}
                    entityName="Künstler"
                    entityRoute="artists"
                    filterFields={filterFields}
                />
            </div>

            <div className="artists-grid">
                {filteredArtists.length === 0 && (
                    <div className="no-artists">Keine Künstler vorhanden.</div>
                )}
                {filteredArtists.map((artist) => (
                    <div className="artist-card" key={artist.id}>
                        <div className="card-header">
                            {editingId === artist.id ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editedData.name}
                                    onChange={handleInputChange}
                                    className="input-name"
                                />
                            ) : (
                                <h3 className="artist-name">{artist.name}</h3>
                            )}

                            {editingId === artist.id ? (
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
                                    onClick={() => handleEditToggle(artist)}
                                    title="Bearbeiten"
                                >
                                    ✎
                                </button>
                            )}
                        </div>

                        <div className="card-body">
                            <div className="image-wrapper">
                                <img
                                    className="artist-image"
                                    src={
                                        editingId === artist.id &&
                                        editedData.artist_image instanceof File
                                            ? URL.createObjectURL(editedData.artist_image)
                                            : artist.artist_image
                                                ? `http://localhost:4000/image/${artist.artist_image}`
                                                : '/placeholder-artist.png'
                                    }
                                    alt={artist.name || 'Unbekannter Künstler'}
                                />
                            </div>

                            <div className="details-wrapper">
                                {editingId === artist.id ? (
                                    <>
                                        <textarea
                                            name="biography"
                                            value={editedData.biography}
                                            onChange={handleInputChange}
                                            placeholder="Biografie"
                                            className="input-bio"
                                        />

                                        <input
                                            type="url"
                                            name="website"
                                            value={editedData.website}
                                            onChange={handleInputChange}
                                            placeholder="Website"
                                            className="input-website"
                                        />
                                        <input
                                            type="file"
                                            name="artist_image"
                                            onChange={handleInputChange}
                                            accept="image/*"
                                            className="input-file"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <p
                                            className={`artist-bio ${
                                                expandedIds.has(artist.id) ? 'expanded' : ''
                                            }`}
                                        >
                                            {artist.biography || '— keine Biografie —'}
                                        </p>
                                        {artist.biography &&
                                            artist.biography.length > 160 && (
                                                <button
                                                    className="read-more"
                                                    onClick={() => toggleExpand(artist.id)}
                                                >
                                                    {expandedIds.has(artist.id)
                                                        ? 'Weniger'
                                                        : 'Mehr Lesen'}
                                                </button>
                                            )}
                                        <div className="website-wrapper">
                                            {artist.website && artist.website.trim() !== '' ? (
                                                <a
                                                    href={artist.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="artist-link"
                                                >
                                                    {artist.website}
                                                </a>
                                            ) : (
                                                <span className="no-link">— keine Website —</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {confirmDeleteId === artist.id && (
                            <div className="modal-overlay">
                                <div className="modal-box">
                                    <p>Möchtest du diesen Künstler wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button
                                            className="btn btn-confirm"
                                            onClick={() => handleDelete(artist.id)}
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