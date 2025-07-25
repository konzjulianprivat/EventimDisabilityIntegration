// src/pages/admin/tours/genre-create.jsx
"use client";

import React, { useState } from 'react';
import { useValidation } from '../../../hooks/useValidation';
import { useRouter } from 'next/router';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';

export default function GenreCreation() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '' });
    const [subgenres, setSubgenres] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const validation = useValidation({ name: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === 'name') validation.validate('name', value, { required: true });
    };

    const addSubgenre = () =>
        setSubgenres((sg) => [...sg, { name: '' }]);

    const updateSubgenre = (idx, val) =>
        setSubgenres((sg) =>
            sg.map((it, i) => (i === idx ? { name: val } : it))
        );

    const removeSubgenre = (idx) =>
        setSubgenres((sg) => sg.filter((_, i) => i !== idx));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!validation.isValid()) {
            setMessage('Bitte gib einen Genre-Namen an');
            setLoading(false);
            return;
        }
        for (let i = 0; i < subgenres.length; i++) {
            if (!subgenres[i].name.trim()) {
                setMessage(`Subgenre ${i + 1} benötigt einen Namen`);
                setLoading(false);
                return;
            }
        }

        try {
            const payload = { ...formData, subgenres };
            const res = await fetch('http://localhost:4000/create-genre', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Genre "${data.genre.name}" erstellt`);
                setFormData({ name: '' });
                setSubgenres([]);
            } else {
                setMessage(data.message || 'Fehler beim Erstellen des Genres');
            }
        } catch (err) {
            console.error('Create genre error:', err);
            setMessage('Serverfehler beim Erstellen des Genres');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="artist-container">
            <h1>Neues Genre erstellen</h1>

            {message && (
                <div
                    className={`message ${
                        message.includes('erstellt')
                            ? 'message-success'
                            : 'message-error'
                    }`}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Genre-Name */}
                <div className="form-group">
                    <label htmlFor="name" className="form-label">
                        Genre Name *
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor(
                            'name',
                            formData.name
                        )}`}
                        required
                    />
                    {validation.errors.name && (
                        <div className="validation-msg">
                            {validation.errors.name}
                        </div>
                    )}
                </div>

                {/* Subgenres */}
                <div className="form-group">
                    <label className="form-label">Subgenres hinzufügen</label>
                    {subgenres.map((sg, i) => (
                        <div key={i} className="form-row">
                            <input
                                type="text"
                                placeholder="Subgenre Name"
                                value={sg.name}
                                onChange={(e) => updateSubgenre(i, e.target.value)}
                                required
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => removeSubgenre(i)}
                                className="btn-remove"
                                aria-label="Subgenre entfernen"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSubgenre}
                        className="btn-inline"
                    >
                        + Subgenre hinzufügen
                    </button>
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="button button-back"
                    >
                        Zurück
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !validation.isValid()}
                        className="button button-submit"
                    >
                        {loading ? 'Bitte warten...' : 'Genre erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}
