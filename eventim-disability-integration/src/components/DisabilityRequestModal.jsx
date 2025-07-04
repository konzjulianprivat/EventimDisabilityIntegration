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
    onSave,
    canEdit,
}) {
    if (!user || !detail) return null;

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        salutation: user.salutation || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        birthDate: user.birth_date || '',
        disabilityDegree: detail.disability_degree || '',
        disabilityCardExpiryDate: detail.disability_card_expiry_date || '',
        marks: detail.marks || [],
    });

    useEffect(() => {
        setFormData({
            salutation: user.salutation || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthDate: user.birth_date || '',
            disabilityDegree: detail.disability_degree || '',
            disabilityCardExpiryDate: detail.disability_card_expiry_date || '',
            marks: detail.marks || [],
        });
    }, [user, detail]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMarksChange = (e) => {
        const val = e.target.value;
        setFormData((prev) => ({
            ...prev,
            marks: val.split(',').map((s) => s.trim()).filter(Boolean),
        }));
    };

    const handleSave = () => {
        onSave && onSave(formData);
        setEditMode(false);
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    return (
        <div className="service__modal-overlay" onClick={onClose}>
            <div className="request-modal-grid" onClick={(e) => e.stopPropagation()}>
                <h2>{user.visible_user_id ? user.visible_user_id : 'User'}</h2>
                <div className="request-modal-grid-left">
                    {editMode ? (
                        <>
                            <input
                                type="text"
                                name="salutation"
                                value={formData.salutation}
                                onChange={handleChange}
                                placeholder="Anrede"
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Vorname"
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Nachname"
                                className="input-name"
                            />
                            <input
                                type="date"
                                name="birthDate"
                                value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                                onChange={handleChange}
                                className="input-name"
                            />
                            <input
                                type="number"
                                name="disabilityDegree"
                                value={formData.disabilityDegree || ''}
                                onChange={handleChange}
                                className="input-name"
                                placeholder="Grad der Behinderung"
                            />
                            <input
                                type="date"
                                name="disabilityCardExpiryDate"
                                value={formData.disabilityCardExpiryDate ? formData.disabilityCardExpiryDate.split('T')[0] : ''}
                                onChange={handleChange}
                                className="input-name"
                            />
                            <input
                                type="text"
                                name="marks"
                                value={formData.marks.join(', ')}
                                onChange={handleMarksChange}
                                placeholder="Merkzeichen (kommagetrennt)"
                                className="input-name"
                            />
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
                    {canEdit && (
                        editMode ? (
                            <button className="btn-save" onClick={handleSave} title="Speichern">💾</button>
                        ) : (
                            <button className="btn-edit" onClick={() => setEditMode(true)} title="Bearbeiten">✎</button>
                        )
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
    onSave: PropTypes.func,
    canEdit: PropTypes.bool,
};
