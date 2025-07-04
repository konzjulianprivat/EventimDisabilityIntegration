import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../hooks/useAuth';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';
import BackLink from '../../../components/back-link';

export default function CountriesContent() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        name: '',
        code: '',
        cities: [],
    });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const router = useRouter();
    const { user } = useAuth();

    const filterFields = [{ key: 'name', label: 'Name', match: 'startsWith' }];

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/countries-with-cities`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            const arr = Array.isArray(j.countries) ? j.countries : [];
            setCountries(arr);
            setFilteredCountries(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Länder:', err);
            setCountries([]);
            setFilteredCountries([]);
        }
    };

    const handleEditToggle = (country) => {
        setEditingId(country.id);
        setEditedData({
            id: country.id,
            name: country.name || '',
            code: country.iso_code || '',
            cities: Array.isArray(country.cities)
                ? country.cities.map((c) => ({ id: c.id, name: c.name }))
                : [],
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedData((prev) => ({ ...prev, [name]: value }));
    };

    const addCity = () => {
        setEditedData((prev) => ({
            ...prev,
            cities: [...prev.cities, { id: null, name: '' }],
        }));
    };

    const updateCity = (index, value) => {
        setEditedData((prev) => ({
            ...prev,
            cities: prev.cities.map((c, i) => (i === index ? { ...c, name: value } : c)),
        }));
    };

    const removeCity = (index) => {
        setEditedData((prev) => ({
            ...prev,
            cities: prev.cities.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: editedData.name,
                code: editedData.code,
                cities: editedData.cities,
            };
            const response = await fetch(`${API_BASE_URL}/countries/${editedData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Server-Fehler beim Speichern');
            setEditingId(null);
            fetchCountries();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/countries/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Server-Fehler beim Löschen');
            setConfirmDeleteId(null);
            fetchCountries();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    return (
        <div className="artists-wrapper">
            <BackLink />
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Länder</h2>
                {user?.hasCreationAccess && (
                    <button
                        className="btn-create-entity"
                        onClick={() => router.push('/admin/countries/create')}
                    >
                        + Land erstellen
                    </button>
                )}
            </div>

            <div className="artists-grid">
                {filteredCountries.length === 0 && (
                    <div className="no-artists">Keine Länder vorhanden.</div>
                )}
                {filteredCountries.map((country) => (
                    <div className="artist-card" key={country.id}>
                        <div className="card-header">
                            {editingId === country.id ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editedData.name}
                                    onChange={handleInputChange}
                                    className="input-name"
                                />
                            ) : (
                                <h3 className="artist-name">{country.name}</h3>
                            )}

                            {editingId === country.id ? (
                                <button className="btn-save" onClick={handleSave} title="Speichern">
                                    💾
                                </button>
                            ) : (
                                user?.hasEditingAccess && (
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditToggle(country)}
                                        title="Bearbeiten"
                                    >
                                        ✎
                                    </button>
                                )
                            )}
                        </div>

                        <div className="card-body">
                            <div className="details-wrapper">
                                {editingId === country.id ? (
                                    <>
                                        <label className="input-label-description">ISO-Code:</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={editedData.code}
                                            onChange={handleInputChange}
                                            placeholder="ISO-Code"
                                            className="input-website"
                                        />
                                        <label className="input-label-description">Städte:</label>
                                        {editedData.cities.map((c, i) => (
                                            <div
                                                key={i}
                                                style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', marginLeft: '0.5rem'}}
                                            >
                                                <input
                                                    type="text"
                                                    value={c.name}
                                                    onChange={(e) => updateCity(i, e.target.value)}
                                                    className="input-website"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeCity(i)}
                                                    style={{ background: 'transparent', border: 'none', color: '#c00' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addCity} className="btn-create-entity">
                                            + Stadt hinzufügen
                                        </button>
                                    </>
                                ) : country.cities && country.cities.length > 0 ? (
                                    <ul className="sub-list">
                                        {country.cities.map((c) => (
                                            <li key={c.id} className="sub-item">
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="artist-bio">Keine Städte vorhanden.</p>
                                )}
                            </div>
                        </div>

                        {editingId !== country.id && user?.hasDeletionPermission && (
                            <button
                                className="btn-edit"
                                style={{ marginLeft: 'auto', marginRight: '0.5rem' }}
                                onClick={() => setConfirmDeleteId(country.id)}
                                title="Löschen"
                            >
                                🗑
                            </button>
                        )}

                        {confirmDeleteId === country.id && user?.hasDeletionPermission && (
                            <div className="modal-overlay">
                                <div className="modal-box">
                                    <p>Möchtest du dieses Land wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button className="btn btn-confirm" onClick={() => handleDelete(country.id)}>
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

