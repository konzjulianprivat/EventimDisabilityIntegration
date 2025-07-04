import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

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

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        salutation: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        disabilityDegree: '',
        disabilityCardExpiryDate: '',
        marks: '',
    });

    useEffect(() => {
        if (user && detail) {
            setForm({
                salutation: user.salutation || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                birthDate: user.birth_date ? user.birth_date.split('T')[0] : '',
                disabilityDegree: detail.disability_degree || '',
                disabilityCardExpiryDate: detail.disability_card_expiry_date
                    ? detail.disability_card_expiry_date.split('T')[0]
                    : '',
                marks: Array.isArray(detail.marks) ? detail.marks.join(', ') : '',
            });
        }
    }, [user, detail]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave &&
            onSave({
                salutation: form.salutation,
                firstName: form.firstName,
                lastName: form.lastName,
                birthDate: form.birthDate,
                disabilityDegree: form.disabilityDegree,
                disabilityCardExpiryDate: form.disabilityCardExpiryDate,
                marks: form.marks
                    .split(',')
                    .map((m) => m.trim())
                    .filter((m) => m),
            });
        setEditMode(false);
    };

    return (
        <div className="service__modal-overlay" onClick={onClose}>
            <div className="request-modal-grid" onClick={(e) => e.stopPropagation()}>
                <h2>{user.visible_user_id ? user.visible_user_id : 'User'}</h2>
                <div className="request-modal-grid-left">
                    {canEdit && !editMode && (
                        <button className="btn-edit" onClick={() => setEditMode(true)} title="Bearbeiten">✎</button>
                    )}
                    {editMode ? (
                        <>
                            <input
                                type="text"
                                name="salutation"
                                value={form.salutation}
                                onChange={handleChange}
                                placeholder="Anrede"
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Vorname"
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Nachname"
                                className="input-name"
                            />
                            <input
                                type="date"
                                name="birthDate"
                                value={form.birthDate}
                                onChange={handleChange}
                                className="input-name"
                            />
                            <input
                                type="number"
                                name="disabilityDegree"
                                value={form.disabilityDegree}
                                onChange={handleChange}
                                placeholder="Grad der Behinderung"
                                className="input-name"
                            />
                            <input
                                type="date"
                                name="disabilityCardExpiryDate"
                                value={form.disabilityCardExpiryDate}
                                onChange={handleChange}
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="marks"
                                value={form.marks}
                                onChange={handleChange}
                                placeholder="Merkzeichen, Komma-getrennt"
                                className="input-name"
                            />
                            <button className="btn-save" onClick={handleSave} title="Speichern">💾</button>
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
