import React from 'react';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../config';

export default function UserDetailModal({ user, orders, onClose }) {
    if (!user) return null;

    const formatDate = (d) => new Date(d).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const formatTime = (d) => new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    const isSent = (oDate) => new Date(oDate).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000;

    return (
        <div className="service__modal-overlay" onClick={onClose}>
            <div className="request-modal-grid" onClick={(e) => e.stopPropagation()}>
                <h2>{user.visible_user_id}</h2>
                <div className="request-modal-grid-left">
                    <p><strong>Name:</strong><br/>{user.salutation} {user.first_name} {user.last_name}</p>
                    <p><strong>E-Mail:</strong><br/>{user.email}</p>
                    <p><strong>Geburtsdatum:</strong><br/>{formatDate(user.birth_date)}</p>
                    <p><strong>E-Mail:</strong><br/>{user.email}</p>
                    <p><strong>Rolle:</strong><br/>{user.role_name}</p>
                    <p><strong>Account erstellt:</strong><br/>{formatDate(user.created_at)}</p>
                    {user.is_currently_disabled && (
                        <>
                            <p><strong>Grad der Behinderung:</strong><br/>{user.disability_degree}</p>
                            <p><strong>Ausweis gültig bis:</strong><br/>{user.disability_card_expiry_date === '9999-01-01' || user.disability_card_expiry_date === '9998-12-31T23:00:00.000Z' ? 'unbegrenzt' : formatDate(user.disability_card_expiry_date)}</p>
                            <p><strong>Merkzeichen:</strong><br/>{user.marks && user.marks.length ? user.marks.join(', ') : 'Keine'}</p>
                        </>
                    )}
                </div>
                <div className="request-modal-grid-images">
                    <table className="orders-table">
                        <thead>
                        <tr>
                            <th>Bestellungsnummer</th>
                            <th>Bestellt am</th>
                            <th>Anzahl d. Tickets</th>
                            <th>Lieferadresse</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((o, idx) => (
                            <tr key={o.id}>
                                <td>#{orders.length - idx}</td>
                                <td>{formatDate(o.created_at)} | {formatTime(o.created_at)}</td>
                                <td>{o.ticket_count}</td>
                                <td>{o.street_address}, {o.postal_code} {o.city}, {o.country}</td>
                                <td><span className={`order-status ${isSent(o.created_at) ? 'send' : 'progress'}`}>{isSent(o.created_at) ? 'In Zustellung' : 'In Bearbeitung'}</span></td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="4">Keine Bestellungen</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="request-modal-actions">
                    <button className="profile__btn-cancel" style={{backgroundColor: '#ccc'}} onClick={onClose}>Schließen</button>
                </div>
            </div>
        </div>
    );
}

UserDetailModal.propTypes = {
    user: PropTypes.object,
    orders: PropTypes.array,
    onClose: PropTypes.func,
};
