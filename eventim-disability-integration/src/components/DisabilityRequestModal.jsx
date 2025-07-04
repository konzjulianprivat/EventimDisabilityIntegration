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
    canEdit = false,
    onSave,
}) {
    if (!user || !detail) return null;

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        salutation: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        disabilityDegree: '',
        disabilityCardExpiryDate: '',
        disabilityMarks: [],
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
                disabilityMarks: detail.marks || [],
            });
        }
    }, [user, detail]);

    const fetchMarks = async () => {
        try {
            const r = await fetch(`${API_BASE_URL}/disability-marks`);
            if (r.ok) {
                const js = await r.json();
                setMarksOptions(js.marks || []);
            }
        } catch (err) {
            console.error('Error loading marks:', err);
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    const toggleEdit = async () => {
        if (!editMode && marksOptions.length === 0) {
            await fetchMarks();
        }
        setEditMode(!editMode);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleMark = (code) => {
        setFormData((prev) => ({
            ...prev,
            disabilityMarks: prev.disabilityMarks.includes(code)
                ? prev.disabilityMarks.filter((m) => m !== code)
                : [...prev.disabilityMarks, code],
        }));
    };

    const saveChanges = async () => {
        if (onSave) {
            await onSave(formData);
        }
        setEditMode(false);
    };

    return (
        <div className="service__modal-overlay" onClick={onClose}>
            <div className="request-modal-grid" onClick={(e) => e.stopPropagation()}>
                <h2>{user.visible_user_id ? user.visible_user_id : 'User'}</h2>
                <div className="request-modal-grid-left">
                    {!editMode ? (
                        <>
                            <p><strong>Name:</strong> <br/>{user.salutation} {user.firstName} {user.lastName}</p>
                            <p><strong>Geburtsdatum:</strong> <br/>{formatDate(user.birth_date)}</p>
                            <p><strong>Grad der Behinderung:</strong> <br/>{detail.disability_degree}</p>
                            <p><strong>Ausweis gültig bis:</strong> <br/>{detail.disability_card_expiry_date === '9998-12-31T23:00:00.000Z' ? 'unbegrenzt' : formatDate(detail.disability_card_expiry_date)}</p>
                            <p><strong>Merkzeichen:</strong> <br/>{detail.marks && detail.marks.length ? detail.marks.join(', ') : 'Keine'}</p>
                        </>
                    ) : (
                        <>
                            <label htmlFor="salutation">Anrede</label>
                            <select name="salutation" id="salutation" value={formData.salutation} onChange={handleChange}>
                                <option value="">Bitte wählen</option>
                                <option value="Herr">Herr</option>
                                <option value="Frau">Frau</option>
                                <option value="Dr.">Dr.</option>
                                <option value="Prof.">Prof.</option>
                            </select>
                            <label htmlFor="firstName">Vorname</label>
                            <input name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} />
                            <label htmlFor="lastName">Nachname</label>
                            <input name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} />
                            <label htmlFor="birthDate">Geburtsdatum</label>
                            <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} />
                            <label htmlFor="disabilityDegree">Grad der Behinderung</label>
                            <input name="disabilityDegree" id="disabilityDegree" value={formData.disabilityDegree} onChange={handleChange} />
                            <label htmlFor="disabilityCardExpiryDate">Ausweis gültig bis</label>
                            <input type="date" name="disabilityCardExpiryDate" id="disabilityCardExpiryDate" value={formData.disabilityCardExpiryDate} onChange={handleChange} />
                            <label>Merkzeichen</label>
                            <div className="marks-grid">
                                {marksOptions.map(mark => {
                                    const sel = formData.disabilityMarks.includes(mark.mark_code);
                                    return (
                                        <div key={mark.mark_code} className={`mark-card ${sel ? 'mark-card--selected' : ''}`} onClick={() => toggleMark(mark.mark_code)}>
                                            <input type="checkbox" id={`mark-${mark.mark_code}`} checked={sel} onChange={() => toggleMark(mark.mark_code)} className="mark-card__checkbox" />
                                            <label htmlFor={`mark-${mark.mark_code}`} className="mark-card__label">{mark.mark_code} – {mark.description}</label>
                                        </div>
                                    );
                                })}
                            </div>
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
                    {onAccept && !editMode && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: 'green' }}
                            onClick={onAccept}
                        >
                            ✓
                        </button>
                    )}
                    {canEdit && (
                        !editMode ? (
                            <button className="profile__btn-cancel" onClick={toggleEdit}>Bearbeiten</button>
                        ) : (
                            <button className="profile__btn-cancel" onClick={saveChanges}>Speichern</button>
                        )
                    )}
                    <button className="profile__btn-cancel" onClick={onClose} style={{backgroundColor: 'grey'}}>Schließen</button>
                    {onDecline && !editMode && (
                        <button
                            className="profile__btn-cancel"
                            style={{ backgroundColor: 'red' }}
                            onClick={onDecline}
                        >
                            x
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
    onSave: PropTypes.func,
};
