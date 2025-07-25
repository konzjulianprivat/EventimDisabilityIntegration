import React, { useEffect, useState } from 'react';
import UserDetailModal from '../../components/UserDetailModal';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { useRequireAccess } from '../../hooks/useRequireAccess';
import BackLink from "../../components/back-link";

export default function UserOverview() {
    useRequireAccess(['hasDisabilityApprovalAccess', 'hasAccountManagementAccess']);
    const [roles, setRoles] = useState([]);
    const [usersByRole, setUsersByRole] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [searchBirthDate, setSearchBirthDate] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user-roles`, {
                credentials: 'include',
            });
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
            const res = await fetch(`${API_BASE_URL}/users?roleId=${roleId}`, {
                credentials: 'include',
            });
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
                fetch(`${API_BASE_URL}/users/${userId}`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/users/${userId}/orders`, { credentials: 'include' })
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

    const handleRoleUpdated = (updatedUser, previousRole) => {
        setUsersByRole(prev => {
            const newState = { ...prev };
            if (newState[previousRole]) {
                newState[previousRole] = newState[previousRole].filter(u => u.user_id !== updatedUser.user_id);
            }
            if (!newState[updatedUser.role]) newState[updatedUser.role] = [];
            newState[updatedUser.role] = [updatedUser, ...newState[updatedUser.role]];
            return newState;
        });
        setSelectedUser(updatedUser);
    };

    const closeModal = () => {
        setSelectedUser(null);
        setSelectedOrders([]);
        window.location.reload();
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <div className="user_management__profile-container" style={{ flexDirection: 'column' }}>
            <div className="content-inner" style={{ paddingTop: '24px' }}>
                <BackLink />
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <h1 className="events-header" style={{color: "#002b55", alignContent: "center"}}>Account-Management</h1>
                        <div className="profile-section-divider"/>
                        <div className="user-search-bar">
                            <h3 style={{color: "#002b55"}}>User-ID:</h3>
                            <input
                                type="text"
                                className="user-search-input"
                                placeholder="User-ID suchen…"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                            />
                            <h3 style={{color: "#002b55", paddingLeft: "0.5rem"}}>Geburtsdatum:</h3>
                            <input
                                type="date"
                                className="user-search-input"
                                placeholder="Geburtsdatum suchen…"
                                value={searchBirthDate}
                                onChange={(e) => setSearchBirthDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
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
                                    {(usersByRole[role.id] || [])
                                        .filter(u => {
                                            const idOk = !searchId || String(u.visible_user_id).includes(searchId);
                                            const birthOk = !searchBirthDate || (u.birth_date && u.birth_date.startsWith(searchBirthDate));
                                            return idOk && birthOk;
                                        })
                                        .map(u => (
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
                <UserDetailModal
                    user={selectedUser}
                    orders={selectedOrders}
                    onClose={closeModal}
                    roles={roles}
                    canEditRole={user?.hasRoleAppointingCapability}
                    currentUserId={user?.userId}
                    onRoleUpdated={handleRoleUpdated}
                />
            )}
        </div>
    );
}
