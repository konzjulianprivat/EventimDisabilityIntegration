import React from 'react';

export default function DisabilityExpiredModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <p>
                    Dein Behindertenausweis ist abgelaufen. Bitte beantrage einen
                    neuen, um weiterhin ermäßigte Tickets buchen zu können.
                </p>
                <div className="modal-actions">
                    <button className="profile__btn-cancel" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
