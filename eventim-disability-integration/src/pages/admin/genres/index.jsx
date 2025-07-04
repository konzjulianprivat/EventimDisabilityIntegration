import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../hooks/useAuth';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';
import BackLink from '../../components/back-link';

export default function GenresContent() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const [genres, setGenres] = useState([]);
    const [filteredGenres, setFilteredGenres] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        name: '',
        subgenres: [],
    });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const router = useRouter();
    const { user } = useAuth();

    const filterFields = [{ key: 'name', label: 'Name', match: 'startsWith' }];

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            const arr = Array.isArray(j.genres) ? j.genres : [];
            setGenres(arr);
            setFilteredGenres(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Genres:', err);
            setGenres([]);
            setFilteredGenres([]);
        }
    };

    const handleEditToggle = (genre) => {
        setEditingId(genre.id);
        setEditedData({
            id: genre.id,
            name: genre.name || '',
            subgenres: Array.isArray(genre.subgenres)
                ? genre.subgenres.map((s) => ({ id: s.id, name: s.name }))
                : [],
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedData((prev) => ({ ...prev, [name]: value }));
    };

    const addSub = () => {
        setEditedData((prev) => ({
            ...prev,
            subgenres: [...prev.subgenres, { id: null, name: '' }],
        }));
    };

    const updateSub = (idx, val) => {
        setEditedData((prev) => ({
            ...prev,
            subgenres: prev.subgenres.map((s, i) => (i === idx ? { ...s, name: val } : s)),
        }));
    };

    const removeSub = (idx) => {
        setEditedData((prev) => ({
            ...prev,
            subgenres: prev.subgenres.filter((_, i) => i !== idx),
        }));
    };

    const handleSave = async () => {
        try {
            const payload = { name: editedData.name, subgenres: editedData.subgenres };
            const response = await fetch(`${API_BASE_URL}/genres/${editedData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Server-Fehler beim Speichern');
            setEditingId(null);
            fetchGenres();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/genres/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Server-Fehler beim Löschen');
            setConfirmDeleteId(null);
            fetchGenres();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    return (
        <div className="artists-wrapper">
            <BackLink />
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Genres</h2>
                {user?.hasCreationAccess && (
                    <button
                        className="btn-create-entity"
                        onClick={() => router.push('/admin/genres/create')}
                    >
                        + Genre erstellen
                    </button>
                )}
            </div>

            <div className="artists-grid">
                {filteredGenres.length === 0 && (
                    <div className="no-artists">Keine Genres vorhanden.</div>
                )}
                {filteredGenres.map((genre) => (
                    <div className="artist-card" key={genre.id}>
                        <div className="card-header">
                            {editingId === genre.id ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editedData.name}
                                    onChange={handleInputChange}
                                    className="input-name"
                                />
                            ) : (
                                <h3 className="artist-name">{genre.name}</h3>
                            )}

                            {editingId === genre.id ? (
                                <button className="btn-save" onClick={handleSave} title="Speichern">
                                    💾
                                </button>
                            ) : (
                                user?.hasEditingAccess && (
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditToggle(genre)}
                                        title="Bearbeiten"
                                    >
                                        ✎
                                    </button>
                                )
                            )}
                        </div>

                        <div className="card-body">
                            <div className="details-wrapper">
                                {editingId === genre.id ? (
                                    <>
                                        <label className="input-label-description">Subgenres:</label>
                                        {editedData.subgenres.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', marginLeft: '0.5rem' }}
                                            >
                                                <input
                                                    type="text"
                                                    value={s.name}
                                                    onChange={(e) => updateSub(i, e.target.value)}
                                                    className="input-website"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSub(i)}
                                                    style={{ background: 'transparent', border: 'none', color: '#c00' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addSub} className="btn-create-entity">
                                            + Subgenre hinzufügen
                                        </button>
                                    </>
                                ) : genre.subgenres && genre.subgenres.length > 0 ? (
                                    <ul className="sub-list">
                                        {genre.subgenres.map((s) => (
                                            <li key={s.id} className="sub-item">
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="artist-bio">Keine Subgenres vorhanden.</p>
                                )}
                            </div>
                        </div>

                        {editingId !== genre.id && user?.hasDeletionPermission && (
                            <button
                                className="btn-edit"
                                style={{ marginLeft: 'auto', marginRight: '0.5rem' }}
                                onClick={() => setConfirmDeleteId(genre.id)}
                                title="Löschen"
                            >
                                🗑
                            </button>
                        )}

                        {confirmDeleteId === genre.id && user?.hasDeletionPermission && (
                            <div className="modal-overlay">
                                <div className="modal-box">
                                    <p>Möchtest du dieses Genre wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button className="btn btn-confirm" onClick={() => handleDelete(genre.id)}>
                                            Ja, löschen
                                        </button>
                                        <button className="btn btn-cancel" onClick={() => setConfirmDeleteId(null)}>
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

