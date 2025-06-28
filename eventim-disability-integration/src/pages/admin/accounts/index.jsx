import React, { useEffect, useState } from 'react';
import UserDetailModal from '../../../components/UserDetailModal';
import { API_BASE_URL } from '../../../config';

export default function UserOverview() {
    const [roles, setRoles] = useState([]);
    const [usersByRole, setUsersByRole] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user-roles`);
            if (res.ok) {
                const js = await res.json();
                setRoles(Array.isArray(js.roles) ? js.roles : []);
                const obj = {};
                (Array.isArray(js.roles) ? js.roles : []).forEach(r => { obj[r.id] = []; });
                setUsersByRole(obj);
                (js.roles || []).forEach(r => fetchUsers(r.id));
            }
        } catch (err) {
            console.error('Error loading roles:', err);
        }
    };

    const fetchUsers = async (roleId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users?roleId=${roleId}`);
            if (res.ok) {
                const js = await res.json();
                setUsersByRole(prev => ({ ...prev, [roleId]: js.users || [] }));
            }
        } catch (err) {
            console.error('Error loading users:', err);
        }
    };

    const openUser = async (userId) => {
        try {
            const [uRes, oRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users/${userId}`),
                fetch(`${API_BASE_URL}/users/${userId}/orders`)
            ]);
            if (uRes.ok) {
                const uj = await uRes.json();
                setSelectedUser(uj.user);
            }
            if (oRes.ok) {
                const oj = await oRes.json();
                setSelectedOrders(Array.isArray(oj.orders) ? oj.orders : []);
            }
        } catch (err) {
            console.error('Error loading user detail:', err);
        }
    };

    const closeModal = () => {
        setSelectedUser(null);
        setSelectedOrders([]);
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <div className="profile-container" style={{ flexDirection: 'column' }}>
            {roles.map(role => (
                <div key={role.id} className="content-inner" style={{ paddingTop: '24px' }}>
                    <div className="white-box events-white-box">
                        <div className="content-inner">
                            <div className="events-header">
                                <h1>{(role.name).toUpperCase()}-Accounts</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Übersicht aller Accounts der Rolle {(role.name).toUpperCase()}</p>
                            <div className="content-inner">
                                <table className="profile-orders-table">
                                    <thead>
                                    <tr>
                                        <th>User-ID</th>
                                        <th>Erstellt am</th>
                                        <th>Bestellungen</th>
                                        <th>Rolle</th>
                                        <th> </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(usersByRole[role.id] || []).map(u => (
                                        <tr key={u.user_id} className="clickable-row" onClick={() => openUser(u.user_id)}>
                                            <td>{u.visible_user_id}</td>
                                            <td>{formatDate(u.created_at)}</td>
                                            <td>{u.order_count}</td>
                                            <td>{(u.role_name).toUpperCase()}</td>
                                            <td><span className="arrow">›</span></td>
                                        </tr>
                                    ))}
                                    {(usersByRole[role.id] || []).length === 0 && (
                                        <tr>
                                            <td colSpan="4">Keine Nutzer vorhanden</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {selectedUser && (
                <UserDetailModal user={selectedUser} orders={selectedOrders} onClose={closeModal} />
            )}
        </div>
    );
}
