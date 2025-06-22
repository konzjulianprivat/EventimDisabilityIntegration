import React from 'react';
import { API_BASE_URL } from '../config';

export default function CheckoutExpiredModal() {
    return (
        <div className="checkout-modal-overlay">
            <div className="checkout-modal">
                <p>Deine Reservierungszeit ist abgelaufen.</p>
                <div className="checkout-modal-actions">
                    <button
                        className="btn-end"
                        onClick={async () => {
                            try {
                                await fetch(`${API_BASE_URL}/checkout`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                });
                            } finally {
                                window.location.href = '/';
                            }
                        }}
                    >
                        Zur Homepage
                    </button>
                </div>
            </div>
        </div>
    );
}
