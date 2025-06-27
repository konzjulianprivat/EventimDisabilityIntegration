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
}) {
    if (!user || !detail) return null;

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
                    <p><strong>Name:</strong> <br/>{user.salutation} {user.firstName} {user.lastName}</p>
                    <p><strong>Geburtsdatum:</strong> <br/>{formatDate(user.birth_date)}</p>
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
                    <button
                        className="profile__btn-cancel"
                        style={{ backgroundColor: 'green' }}
                        onClick={onAccept}
                    >
                        ✓
                    </button>
                    <button className="profile__btn-cancel" onClick={onClose}>Schließen</button>
                    <button
                        className="profile__btn-cancel"
                        style={{ backgroundColor: 'red' }}
                        onClick={onDecline}
                    >
                        x
                    </button>
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
};
