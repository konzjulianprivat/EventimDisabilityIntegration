import React, { useState } from 'react';
import { useValidation } from '../../../hooks/useValidation';
import { useRouter } from 'next/router';
import { useRequireAccess } from '../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../adminPermissions';


export default function CountryCreation() {
    useRequireAccess(ADMIN_PERMISSIONS);
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const validation = useValidation({ name: '', code: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'name') {
            validation.validate('name', value, { required: true });
        }
        if (name === 'code' && value) {
            validation.validate('code', value, {
                pattern: /^[A-Za-z]{2}$/, message: 'Code muss 2 Buchstaben haben',
            });
        } else if (name === 'code') {
            validation.validate('code', value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!validation.isValid()) {
            setMessage('Bitte alle Pflichtfelder korrekt ausfüllen');
            setLoading(false);
            return;
        }

        try {
   const response = await fetch('http://localhost:4000/countries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(`Land „${data.country.name}“ erfolgreich erstellt!`);
                setFormData({ name: '', code: '' });
            } else {
                setMessage(data.message || 'Fehler beim Erstellen des Landes');
            }
        } catch (error) {
            console.error('Create country error:', error);
            setMessage('Serverfehler beim Erstellen des Landes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="artist-container">
            <h1>Neues Land anlegen</h1>

            {message && (
                <div className={`message ${message.includes('erfolgreich') ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Name des Landes *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor('name', formData.name)}`}
                        required
                    />
                    {validation.errors.name && (
                        <div className="validation-msg">{validation.errors.name}</div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="code" className="form-label">ISO-Code (optional)</label>
                    <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={`form-input ${validation.classFor('code', formData.code)}`}
                        placeholder="z.B. DE für Deutschland"
                    />
                    {validation.errors.code && (
                        <div className="validation-msg">{validation.errors.code}</div>
                    )}
                </div>

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
                        {loading ? 'Bitte warten...' : 'Land erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}
