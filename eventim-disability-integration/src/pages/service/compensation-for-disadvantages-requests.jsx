// pages/service/compensation-for-disadvantages-requests.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import DisabilityRequestModal from '../../components/DisabilityRequestModal';

export default function CompensationRequests() {
    const [requests, setRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detail, setDetail] = useState(null);
    const [imgFrontUrl, setImgFrontUrl] = useState(null);
    const [imgBackUrl, setImgBackUrl] = useState(null);

    useEffect(() => {
        async function fetchPending() {
            try {
                const r = await fetch(`${API_BASE_URL}/pending-disability-requests`);
                if (r.ok) {
                    const js = await r.json();
                    setRequests(Array.isArray(js.requests) ? js.requests : []);
                }
            } catch (err) {
                console.error('Error loading requests:', err);
            }
        }

        async function fetchAccepted() {
            try {
                const r = await fetch(`${API_BASE_URL}/accepted-disability-requests`);
                if (r.ok) {
                    const js = await r.json();
                    setAcceptedRequests(Array.isArray(js.requests) ? js.requests : []);
                }
            } catch (err) {
                console.error('Error loading accepted requests:', err);
            }
        }

        fetchPending();
        fetchAccepted();
    }, []);

    const loadDetail = async (req) => {
        try {
            const r = await fetch(`${API_BASE_URL}/users/${req.user_id}/disability`);
            if (!r.ok) return;
            const js = await r.json();
            setDetail(js.disabilityData || null);
            setSelectedUser({
                ...req,
                salutation: js.user?.salutation || '',
                firstName: js.user?.firstName || '',
                lastName: js.user?.lastName || '',
            });

            if (js.disabilityData?.disability_card_image_front) {
                const fr = await fetch(`${API_BASE_URL}/image/${js.disabilityData.disability_card_image_front}`);
                if (fr.ok) {
                    const blob = await fr.blob();
                    setImgFrontUrl(URL.createObjectURL(blob));
                }
            }
            if (js.disabilityData?.disability_card_image_back) {
                const br = await fetch(`${API_BASE_URL}/image/${js.disabilityData.disability_card_image_back}`);
                if (br.ok) {
                    const blob = await br.blob();
                    setImgBackUrl(URL.createObjectURL(blob));
                }
            }
        } catch (err) {
            console.error('Error loading disability data:', err);
        }
    };

    const closeModal = () => {
        if (imgFrontUrl) URL.revokeObjectURL(imgFrontUrl);
        if (imgBackUrl) URL.revokeObjectURL(imgBackUrl);
        setImgFrontUrl(null);
        setImgBackUrl(null);
        setSelectedUser(null);
        setDetail(null);
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    return (
        <div className="admin-container">
            <h1 className="admin-heading">Offene Anträge</h1>
            <table className="profile-orders-table">
                <thead>
                    <tr>
                        <th>User-ID</th>
                        <th>Geburtsdatum</th>
                        <th>Letzte Änderung</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((r) => (
                        <tr key={r.user_id} className="clickable-row" onClick={() => loadDetail(r)}>
                            <td>{r.visible_user_id}</td>
                            <td>{formatDate(r.birth_date)}</td>
                            <td>{formatDate(r.updated_at)}</td>
                            <td>Offen</td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr>
                            <td colSpan="4">Keine offenen Anträge</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <h1 className="admin-heading">Akzeptierte Anfragen (letzte 30 Tage)</h1>
            <table className="profile-orders-table">
                <thead>
                    <tr>
                        <th>User-ID</th>
                        <th>Geburtsdatum</th>
                        <th>Letzte Änderung</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {acceptedRequests.map((r) => (
                        <tr key={r.user_id} className="clickable-row" onClick={() => loadDetail(r)}>
                            <td>{r.visible_user_id}</td>
                            <td>{formatDate(r.birth_date)}</td>
                            <td>{formatDate(r.updated_at)}</td>
                            <td>Akzeptiert</td>
                        </tr>
                    ))}
                    {acceptedRequests.length === 0 && (
                        <tr>
                            <td colSpan="4">Keine akzeptierten Anträge</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {selectedUser && detail && (
                <DisabilityRequestModal
                    user={selectedUser}
                    detail={detail}
                    imgFrontUrl={imgFrontUrl}
                    imgBackUrl={imgBackUrl}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

