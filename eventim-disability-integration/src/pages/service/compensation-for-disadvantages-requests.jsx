// pages/service/compensation-for-disadvantages-requests.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import '../../styles/service.css';

export default function CompensationRequests() {
    const [requests, setRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detail, setDetail] = useState(null);
    const [imgFrontUrl, setImgFrontUrl] = useState(null);
    const [imgBackUrl, setImgBackUrl] = useState(null);

    useEffect(() => {
        async function fetchRequests() {
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
        fetchRequests();
    }, []);

    const loadDetail = async (req) => {
        try {
            const r = await fetch(`${API_BASE_URL}/users/${req.user_id}/disability`);
            if (!r.ok) return;
            const js = await r.json();
            setDetail(js.disabilityData || null);
            setSelectedUser(req);

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
                            <td>{r.birth_date}</td>
                            <td>{new Date(r.updated_at).toLocaleDateString()}</td>
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

            {selectedUser && detail && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2>User {selectedUser.visible_user_id}</h2>
                        <div className="request-modal-content">
                            <div className="request-modal-info">
                                <p>Grad der Behinderung: {detail.disability_degree}</p>
                                <p>Ausweis gültig bis: {detail.disability_card_expiry_date}</p>
                                <p>Merkzeichen: {detail.marks && detail.marks.length ? detail.marks.join(', ') : 'Keine'}</p>
                            </div>
                            <div className="request-modal-images">
                                {imgFrontUrl && (
                                    <img src={imgFrontUrl} alt="Vorderseite" className="disability-card-image" />
                                )}
                                {imgBackUrl && (
                                    <img src={imgBackUrl} alt="Rückseite" className="disability-card-image" />
                                )}
                            </div>
                        </div>
                        <button className="profile__btn-cancel modal-close" onClick={closeModal}>
                            Schließen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

