"use client";

import React, { useState, useEffect } from 'react';
import { useValidation } from '../../../hooks/useValidation';
import { useRouter } from 'next/router';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';

export default function ArtistCreation() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        biography: '',
        website: '',
        artistImage: null,
    });
    const [countries, setCountries] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const validation = useValidation({ name: '', website: '' });

    useEffect(() => {
        fetch('http://localhost:4000/countries')
            .then(res => res.json())
            .then(data => setCountries(data.countries))
            .catch(err => console.error('Fehler beim Laden der Länder:', err));
    }, []);

    const handleChange = e => {
        const { name, type, value, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, artistImage: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (name === 'name') {
                validation.validate('name', value, { required: true });
            }
            if (name === 'website') {
                if (value) {
                    validation.validate('website', value, {
                        pattern: /^https?:\/\//i,
                        message: 'Ungültige URL',
                    });
                } else {
                    validation.validate('website', value);
                }
            }
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!validation.isValid()) {
            setMessage('Bitte alle Pflichtfelder korrekt ausfüllen');
            setLoading(false);
            return;
        }

        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('biography', formData.biography);
            fd.append('website', formData.website);
            if (formData.artistImage) fd.append('artistImage', formData.artistImage);

            const response = await fetch('http://localhost:4000/create-artist', {
                method: 'POST',
                body: fd,
            });
            const data = await response.json();

            if (response.ok) {
                setMessage('Künstler erfolgreich erstellt! Weiterleitung...');
                setTimeout(() => router.push('/admin/artists'), 2000);
            } else {
                setMessage(data.message || 'Erstellung fehlgeschlagen');
            }
        } catch (error) {
            console.error('Artist creation error:', error);
            setMessage('Serverfehler beim Erstellen des Künstlers');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="artist-container">
            <h1>Neuen Künstler erstellen</h1>

            {message && (
                <div
                    className={`message ${
                        message.includes('erfolgreich') ? 'message-success' : 'message-error'
                    }`}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="form-group">
                    <label htmlFor="name" className="form-label">
                        Name *
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor('name', formData.name)}`}
                        required
                    />
                    {validation.errors.name && (
                        <div className="validation-msg">{validation.errors.name}</div>
                    )}
                </div>

                {/* Biografie */}
                <div className="form-group">
                    <label htmlFor="biography" className="form-label">
                        Biografie
                    </label>
                    <textarea
                        id="biography"
                        name="biography"
                        value={formData.biography}
                        onChange={handleChange}
                        rows={4}
                        className="form-textarea"
                    />
                </div>

                {/* Website */}
                <div className="form-group">
                    <label htmlFor="website" className="form-label">
                        Website
                    </label>
                    <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className={`form-input ${validation.classFor('website', formData.website)}`}
                    />
                    {validation.errors.website && (
                        <div className="validation-msg">{validation.errors.website}</div>
                    )}
                </div>

                {/* Künstlerbild */}
                <div className="form-group">
                    <label htmlFor="artistImage" className="form-label">
                        Künstlerbild hochladen
                    </label>
                    <input
                        id="artistImage"
                        name="artistImage"
                        type="file"
                        onChange={handleChange}
                        className="form-file-input"
                    />
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
                        {loading ? 'Bitte warten...' : 'Künstler erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}
