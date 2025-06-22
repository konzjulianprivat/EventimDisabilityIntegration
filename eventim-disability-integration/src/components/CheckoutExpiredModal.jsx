import React from 'react';

export default function CheckoutExpiredModal({ onClose }) {
    return (
        <div className="checkout-modal-overlay">
            <div className="checkout-modal">
                <p>Deine Reservierungszeit ist abgelaufen.</p>
                <div className="checkout-modal-actions">
                    <button className="btn-end" onClick={onClose}>
                        Zur Homepage
                    </button>
                </div>
            </div>
        </div>
    );
}
