import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../config';

export default function DisabilityRequestModal({
    user,
    detail,
    imgFrontUrl,
    imgBackUrl,
    onClose,
    onAccept,
    onDecline,
    canEdit,
}) {
    if (!user || !detail) return null;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        salutation: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        disabilityDegree: '',
        disabilityCardExpiryDate: '',
        marks: [],
    });
    const [marksOptions, setMarksOptions] = useState([]);

    useEffect(() => {
        if (user && detail) {
            setFormData({
                salutation: user.salutation || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                birthDate: user.birth_date ? user.birth_date.split('T')[0] : '',
                disabilityDegree: detail.disability_degree || '',
                disabilityCardExpiryDate: detail.disability_card_expiry_date
                    ? detail.disability_card_expiry_date.split('T')[0]
                    : '',
                marks: Array.isArray(detail.marks) ? detail.marks : [],
            });
        }
    }, [user, detail]);

    useEffect(() => {
        if (editMode) {
            fetch(`${API_BASE_URL}/disability-marks`)
                .then((r) => r.ok ? r.json() : { marks: [] })
                .then((js) => setMarksOptions(Array.isArray(js.marks) ? js.marks : []))
                .catch((err) => console.error('Error loading marks:', err));
        }
    }, [editMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleMark = (code) => {
        setFormData((prev) => ({
            ...prev,
            marks: prev.marks.includes(code)
                ? prev.marks.filter((m) => m !== code)
                : [...prev.marks, code],
        }));
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    salutation: formData.salutation,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    birthDate: formData.birthDate,
                    disabilityDegree: formData.disabilityDegree,
                    disabilityCardExpiryDate: formData.disabilityCardExpiryDate,
                    disabilityMarks: formData.marks,
                }),
            });
            if (res.ok) {
                setEditMode(false);
            }
        } catch (err) {
            console.error('Error saving changes:', err);
        }
    };

    return (
        <div className="service__modal-overlay" onClick={onClose}>
            <div className="request-modal-grid" onClick={(e) => e.stopPropagation()}>
                <h2>{user.visible_user_id ? user.visible_user_id : 'User'}</h2>
                <div className="request-modal-grid-left">
                    {editMode ? (
                        <>
                            <div className="form-field">
                                <label htmlFor="salutation">Anrede</label>
                                <select
                                    id="salutation"
                                    name="salutation"
                                    value={formData.salutation}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="">Bitte wählen</option>
                                    <option value="Herr">Herr</option>
                                    <option value="Frau">Frau</option>
                                    <option value="Dr.">Dr.</option>
                                    <option value="Prof.">Prof.</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="firstName">Vorname</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="lastName">Nachname</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="birthDate">Geburtsdatum</label>
                                <input
                                    type="date"
                                    id="birthDate"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="degree">Grad der Behinderung</label>
                                <input
                                    id="degree"
                                    name="disabilityDegree"
                                    value={formData.disabilityDegree || ''}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="expiry">Ausweis gültig bis</label>
                                <input
                                    type="date"
                                    id="expiry"
                                    name="disabilityCardExpiryDate"
                                    value={formData.disabilityCardExpiryDate}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-field">
                                <label>Merkzeichen</label>
                                <div className="marks-grid">
                                    {marksOptions.map((mark) => {
                                        const isSel = formData.marks.includes(mark.mark_code);
                                        return (
                                            <div
                                                key={mark.mark_code}
                                                className={`mark-card ${isSel ? 'mark-card--selected' : ''}`}
                                                onClick={() => toggleMark(mark.mark_code)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`mark-${mark.mark_code}`}
                                                    className="mark-card__checkbox"
                                                    checked={isSel}
                                                    onChange={() => toggleMark(mark.mark_code)}
                                                />
                                                <label htmlFor={`mark-${mark.mark_code}`} className="mark-card__label">
                                                    {mark.mark_code} – {mark.description}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p><strong>Name:</strong> <br/>{user.salutation} {user.firstName} {user.lastName}</p>
                            <p><strong>Geburtsdatum:</strong> <br/>{formatDate(user.birth_date)}</p>
                            <p><strong>Grad der Behinderung:</strong> <br/>{detail.disability_degree}</p>
                            <p><strong>Ausweis gültig bis:</strong> <br/>{detail.disability_card_expiry_date === '9998-12-31T23:00:00.000Z' ? 'unbegrenzt' : formatDate(detail.disability_card_expiry_date)}</p>
                            <p><strong>Merkzeichen:</strong> <br/>{detail.marks && detail.marks.length ? detail.marks.join(', ') : 'Keine'}</p>
                        </>
                    )}
                </div>
                <div className="request-modal-grid-images">
                    {imgFrontUrl && (
                        <img src={imgFrontUrl} alt="Vorderseite" className="disability-card-image" />
                    )}
                    {imgBackUrl && (
                        <img src={imgBackUrl} alt="Rückseite" className="disability-card-image" />
                    )}
                </div>
                <div className="request-modal-actions">
                    {onAccept && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: 'green' }}
                            onClick={onAccept}
                        >
                            ✓
                        </button>
                    )}
                    <button className="profile__btn-cancel" onClick={onClose} style={{backgroundColor: 'grey'}}>Schließen</button>
                    {onDecline && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: 'red' }}
                            onClick={onDecline}
                        >
                            x
                        </button>
                    )}
                    {canEdit && !editMode && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: '#ffc107' }}
                            onClick={() => setEditMode(true)}
                        >
                            Edit
                        </button>
                    )}
                    {canEdit && editMode && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: '#28a745' }}
                            onClick={saveEdit}
                        >
                            💾
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

DisabilityRequestModal.propTypes = {
    user: PropTypes.object,
    detail: PropTypes.object,
    imgFrontUrl: PropTypes.string,
    imgBackUrl: PropTypes.string,
    onClose: PropTypes.func,
    onAccept: PropTypes.func,
    onDecline: PropTypes.func,
    canEdit: PropTypes.bool,
};
