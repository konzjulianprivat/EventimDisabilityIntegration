import React from 'react';
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

    const [editMode, setEditMode] = React.useState(false);
    const [formData, setFormData] = React.useState({
        salutation: user.salutation || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        birthDate: user.birth_date || '',
    });

    React.useEffect(() => {
        setFormData({
            salutation: user.salutation || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthDate: user.birth_date || '',
        });
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave &&
            onSave({
                salutation: formData.salutation,
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthDate: formData.birthDate,
            });
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
                            <label>
                                <strong>Anrede:</strong>
                                <select name="salutation" value={formData.salutation} onChange={handleChange}>
                                    <option value="">Bitte wählen</option>
                                    <option value="Herr">Herr</option>
                                    <option value="Frau">Frau</option>
                                    <option value="Dr.">Dr.</option>
                                    <option value="Prof.">Prof.</option>
                                    <option value="Divers">Divers</option>
                                </select>
                            </label>
                            <label>
                                <strong>Vorname:</strong>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                            </label>
                            <label>
                                <strong>Nachname:</strong>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                            </label>
                            <label>
                                <strong>Geburtsdatum:</strong>
                                <input type="date" name="birthDate" value={formData.birthDate ? formData.birthDate.split('T')[0] : ''} onChange={handleChange} />
                            </label>
                        </>
                    ) : (
                        <>
                            <p><strong>Name:</strong> <br/>{user.salutation} {user.firstName} {user.lastName}</p>
                            <p><strong>Geburtsdatum:</strong> <br/>{formatDate(user.birth_date)}</p>
                        </>
                    )}
                    <p><strong>Grad der Behinderung:</strong> <br/>{detail.disability_degree}</p>
                    <p><strong>Ausweis gültig bis:</strong> <br/>{detail.disability_card_expiry_date === '9998-12-31T23:00:00.000Z' ? 'unbegrenzt' : formatDate(detail.disability_card_expiry_date)}</p>
                    <p><strong>Merkzeichen:</strong> <br/>{detail.marks && detail.marks.length ? detail.marks.join(', ') : 'Keine'}</p>
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
                    {canEdit && !editMode && (
                        <button className="btn-edit" onClick={() => setEditMode(true)} title="Bearbeiten">✎</button>
                    )}
                    {canEdit && editMode && (
                        <button className="btn-save" onClick={handleSave} title="Speichern">💾</button>
                    )}
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
