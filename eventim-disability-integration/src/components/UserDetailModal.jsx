import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../config';

export default function UserDetailModal({ user, orders, onClose, roles = [], canEditRole = false, currentUserId, onRoleUpdated }) {
    if (!user) return null;

    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [selectedRole, setSelectedRole] = useState(user.role);

    const formatDate = (d) => new Date(d).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const formatTime = (d) => new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    const isSent = (oDate) => new Date(oDate).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000;

    const handleOrderClick = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setTickets([]);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data.tickets) ? data.tickets : []);
                setExpandedOrderId(orderId);
            }
        } catch (err) {
            console.error('Error fetching order detail:', err);
        }
    };

    const handleSaveRole = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/role`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId: selectedRole }),
            });
            if (res.ok) {
                const data = await res.json();
                onRoleUpdated && onRoleUpdated(data.user, user.role);
                setEditMode(false);
            }
        } catch (err) {
            console.error('Error updating role:', err);
        }
    };

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
                            <React.Fragment key={o.id}>
                                <tr
                                    className="order-row"
                                    onClick={() => handleOrderClick(o.id)}
                                >
                                    <td>#{orders.length - idx}</td>
                                    <td>{formatDate(o.created_at)} | {formatTime(o.created_at)}</td>
                                    <td>{o.ticket_count}</td>
                                    <td>{o.street_address}, {o.postal_code} {o.city}, {o.country}</td>
                                    <td>
                                        <span className={`order-status ${isSent(o.created_at) ? 'send' : 'progress'}`}>{isSent(o.created_at) ? 'In Zustellung' : 'In Bearbeitung'}</span>
                                    </td>
                                </tr>
                                {expandedOrderId === o.id && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: 0 }}>
                                            <table className="tickets-table" style={{ marginLeft: '2rem' }}>
                                                <thead>
                                                <tr>
                                                    <th>Event</th>
                                                    <th>Kategorie</th>
                                                    <th> </th>
                                                    <th>Sitz</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {tickets.map(t => (
                                                    <tr key={t.id}>
                                                        <td>{t.event_title}</td>
                                                        <td>{t.event_category}</td>
                                                        <td>{t.is_assistance_ticket ? <span className="assist-flag">B</span> : ''}</td>
                                                        <td>{t.seat_number}</td>
                                                    </tr>
                                                ))}
                                                {tickets.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4">Keine Tickets</td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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
                    {canEditRole && user.user_id !== currentUserId && (
                        !editMode ? (
                            <button className="profile__btn-cancel" onClick={() => setEditMode(true)}>Rolle anpassen</button>
                        ) : (
                            <>
                                <select className="role-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                <button className="profile__btn-cancel" onClick={handleSaveRole}>Speichern</button>
                            </>
                        )
                    )}
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
    roles: PropTypes.array,
    canEditRole: PropTypes.bool,
    currentUserId: PropTypes.string,
    onRoleUpdated: PropTypes.func,
};
