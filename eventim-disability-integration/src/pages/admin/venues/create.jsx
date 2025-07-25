// src/pages/admin/tours/venues.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useValidation } from '../../../hooks/useValidation';
import { useRouter } from 'next/router';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';

export default function VenueCreation() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cityId: '',
        website: '',
        venueImage: null,
    });
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [venueAreas, setVenueAreas] = useState([]); // [{ areaId, maxCapacity }]
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const validation = useValidation({
        name: '',
        address: '',
        cityId: '',
        website: '',
    });

    useEffect(() => {
        fetch('http://localhost:4000/cities')
            .then((r) => r.json())
            .then((d) => setCities(d.cities));
        fetch('http://localhost:4000/areas')
            .then((r) => r.json())
            .then((d) => setAreas(d.areas));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData((f) => ({ ...f, [name]: files[0] }));
        } else {
            setFormData((f) => ({ ...f, [name]: value }));
            if (name === 'name') validation.validate('name', value, { required: true });
            if (name === 'address')
                validation.validate('address', value, { required: true });
            if (name === 'cityId')
                validation.validate('cityId', value, { required: true });
            if (name === 'website' && value) {
                validation.validate('website', value, {
                    pattern: /^https?:\/\//i,
                    message: 'Ungültige URL',
                });
            } else if (name === 'website') {
                validation.validate('website', value);
            }
        }
    };

    const addArea = () =>
        setVenueAreas((v) => [...v, { areaId: '', maxCapacity: '' }]);
    const updateArea = (idx, field, val) =>
        setVenueAreas((v) =>
            v.map((it, i) => (i === idx ? { ...it, [field]: val } : it))
        );
    const removeArea = (idx) =>
        setVenueAreas((v) => v.filter((_, i) => i !== idx));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!validation.isValid()) {
            setMessage('Name, Adresse und Stadt sind erforderlich');
            setLoading(false);
            return;
        }
        if (venueAreas.length === 0) {
            setMessage('Mindestens ein Bereich mit Kapazität > 0 ist erforderlich');
            setLoading(false);
            return;
        }
        for (const va of venueAreas) {
            if (!va.areaId || !va.maxCapacity || parseInt(va.maxCapacity, 10) <= 0) {
                setMessage('Alle Bereiche benötigen eine Kapazität > 0 und Auswahl');
                setLoading(false);
                return;
            }
        }

        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('address', formData.address);
            fd.append('cityId', formData.cityId);
            fd.append('website', formData.website);
            fd.append('venueAreas', JSON.stringify(venueAreas));
            if (formData.venueImage) fd.append('venueImage', formData.venueImage);

            const res = await fetch('http://localhost:4000/create-venue', {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Venue „${data.venue.name}“ erstellt`);
                setFormData({
                    name: '',
                    address: '',
                    cityId: '',
                    website: '',
                    venueImage: null,
                });
                setVenueAreas([]);
            } else {
                setMessage(data.message || 'Fehler beim Erstellen');
            }
        } catch (err) {
            console.error(err);
            setMessage('Serverfehler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="artist-container">
            <h1>Neuen Veranstaltungsort anlegen</h1>

            {message && (
                <div
                    className={`message ${
                        message.includes('erstellt') ? 'message-success' : 'message-error'
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
                        className={`form-input ${validation.classFor(
                            'name',
                            formData.name
                        )}`}
                        required
                    />
                    {validation.errors.name && (
                        <div className="validation-msg">{validation.errors.name}</div>
                    )}
                </div>

                {/* Address */}
                <div className="form-group">
                    <label htmlFor="address" className="form-label">
                        Adresse *
                    </label>
                    <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor(
                            'address',
                            formData.address
                        )}`}
                        required
                    />
                    {validation.errors.address && (
                        <div className="validation-msg">{validation.errors.address}</div>
                    )}
                </div>

                {/* City */}
                <div className="form-group">
                    <label htmlFor="cityId" className="form-label">
                        Stadt *
                    </label>
                    <select
                        id="cityId"
                        name="cityId"
                        value={formData.cityId}
                        onChange={handleChange}
                        className={`form-select ${validation.classFor(
                            'cityId',
                            formData.cityId
                        )}`}
                        required
                    >
                        <option value="">Bitte wählen</option>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {validation.errors.cityId && (
                        <div className="validation-msg">{validation.errors.cityId}</div>
                    )}
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
                        className={`form-input ${validation.classFor(
                            'website',
                            formData.website
                        )}`}
                    />
                    {validation.errors.website && (
                        <div className="validation-msg">{validation.errors.website}</div>
                    )}
                </div>

                {/* Venue Image */}
                <div className="form-group">
                    <label htmlFor="venueImage" className="form-label">
                        Bild hochladen
                    </label>
                    <input
                        id="venueImage"
                        name="venueImage"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="form-file-input"
                    />
                </div>

                {/* Areas */}
                <div className="form-group">
                    <label className="form-label">Bereiche hinzufügen</label>
                    {venueAreas.map((va, i) => (
                        <div key={i} className="form-row">
                            <select
                                value={va.areaId}
                                onChange={(e) => updateArea(i, 'areaId', e.target.value)}
                                required
                                className="form-select"
                            >
                                <option value="">Bereich wählen</option>
                                {areas.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="0"
                                placeholder="Kapazität"
                                value={va.maxCapacity}
                                onChange={(e) =>
                                    updateArea(i, 'maxCapacity', e.target.value)
                                }
                                required
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => removeArea(i)}
                                className="btn-remove"
                                aria-label="Bereich entfernen"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addArea} className="btn-inline">
                        + Bereich hinzufügen
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
                        {loading ? 'Bitte warten...' : 'Veranstaltungsort erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}
