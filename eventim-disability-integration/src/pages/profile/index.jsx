// pages/profile/shopping-cart.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import SquareTourCard from "../../components/squareTourCard";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../hooks/useAuth";

export async function getServerSideProps({ req }) {
    const cookie = req.headers.cookie || "";
    try {
        const res = await fetch(`${API_BASE_URL}/session-status`, {
            headers: { cookie },
        });
        const data = await res.json();
        if (!data.loggedIn) {
            return {
                redirect: {
                    destination: "/login?redirect=/profile",
                    permanent: false,
                },
            };
        }
    } catch {
        return {
            redirect: {
                destination: "/login?redirect=/profile",
                permanent: false,
            },
        };
    }
    return { props: {} };
}

export default function ProfilePage() {
    // Carousel indices
    const [carouselIndex, setCarouselIndex] = useState(0);
    // How many cards fit side‐by‐side? 1 – 8
    const [visibleCount, setVisibleCount] = useState(1);
    const carouselRef = useRef(null);

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [qrTicketId, setQrTicketId] = useState(null);

    const [myEvents, setMyEvents] = useState([]);
    const [tours, setTours] = useState([]);

    const { loading: authLoading, user } = useAuth();

    const [activeSidebarItem, setActiveSidebarItem] = useState("Meine Events");
    // refs for each section
    const eventsRef   = useRef(null);
    const ordersRef   = useRef(null);
    const dataRef     = useRef(null);
    const faqRef      = useRef(null);

    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [deletePrompt, setDeletePrompt] = useState(false);
    const [deleteText, setDeleteText] = useState("");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [disabilityMarks, setDisabilityMarks] = useState([]);
    const [selectedMarks, setSelectedMarks] = useState([]);
    const [showDisabilityForm, setShowDisabilityForm] = useState(false);

    const scrollTo = ref => {
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const onSidebarClick = label => {
        setActiveSidebarItem(label);
        switch (label) {
            case "Meine Events":
                scrollTo(eventsRef);
                break;
            case "Meine Bestellungen":
                scrollTo(ordersRef);
                break;
            case "Meine Daten":
                scrollTo(dataRef);
                break;
            case "Help Center / FAQ":
                scrollTo(faqRef);
                break;
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data.orders) ? data.orders : []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    };

    const fetchMyEvents = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/my-events`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMyEvents(Array.isArray(data.events) ? data.events : []);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const fetchTours = async (marks) => {
        try {
            const query = marks && marks.length > 0
                ? `?marks=${encodeURIComponent(marks.join(','))}`
                : '';
            const res = await fetch(`${API_BASE_URL}/tours-detailed${query}`);
            if (res.ok) {
                const data = await res.json();
                setTours(Array.isArray(data.tours) ? data.tours : []);
            }
        } catch (err) {
            console.error('Error fetching tours:', err);
        }
    };

    const fetchOrderDetail = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedOrder({ id, ...data });
            }
        } catch (err) {
            console.error('Error fetching order detail:', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user-profile`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setProfileData({
                        salutation: data.user.salutation || '',
                        firstName: data.user.first_name || '',
                        lastName: data.user.last_name || '',
                        email: data.user.email || '',
                        birthDate: data.user.birth_date ? data.user.birth_date.split('T')[0] : '',
                        phone: data.user.phone || '',
                        streetAddress: data.user.street_address || '',
                        postalCode: data.user.postal_code || '',
                        city: data.user.city || '',
                        country: data.user.country || '',
                        company: data.user.company || '',
                        disabilityCheck: data.user.disability_check || false,
                        disabilityDegree: data.user.disability_degree || '',
                        disabilityCardImage: null,
                    });
                    setSelectedMarks(Array.isArray(data.user.disability_marks) ? data.user.disability_marks : []);
                }
            }
        } catch (err) {
            console.error('Error fetching profile data:', err);
        }
    };

    const fetchMarks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/disability-marks`);
            if (res.ok) {
                const data = await res.json();
                setDisabilityMarks(Array.isArray(data.marks) ? data.marks : []);
            }
        } catch (err) {
            console.error('Error fetching disability marks:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchMyEvents();
        fetchProfile();
        fetchMarks();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        const marks = (user && user.disabilityMarks) || [];
        fetchTours(marks);
    }, [authLoading, user]);

    // Recalculate on mount + resize
    useEffect(() => {
        const CARD_W = 180;
        const GAP = 16; // 1rem
        function updateCount() {
            const w = carouselRef.current?.clientWidth ?? window.innerWidth;
            const count = Math.floor((w + GAP) / (CARD_W + GAP));
            const clamp = Math.min(8, Math.max(1, count));
            setVisibleCount(clamp);
            setCarouselIndex(ci => Math.min(ci, tours.length - clamp));
        }
        updateCount();
        window.addEventListener("resize", updateCount);
        return () => window.removeEventListener("resize", updateCount);
    }, []);

    const handlePrev = () => {
        if (carouselIndex > 0) setCarouselIndex(i => i - 1);
    };
    const handleNext = () => {
        if (carouselIndex < tours.length - visibleCount)
            setCarouselIndex(i => i + 1);
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Slices for blue cards (Meine Events) and recommendations
    const blueCards = myEvents.slice(0, visibleCount);
    const recommendCards = tours.slice(
        carouselIndex,
        carouselIndex + visibleCount
    );

    const closeModal = () => {
        setQrTicketId(null);
        setSelectedOrder(null);
    };

    const handleProfileChange = (e) => {
        const { name, type, value, files, checked } = e.target;
        if (!profileData) return;
        if (type === 'file') {
            setProfileData(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'checkbox') {
            setProfileData(prev => ({ ...prev, [name]: checked }));
        } else {
            setProfileData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleMark = (code) => {
        setSelectedMarks(prev => prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code]);
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        if (!profileData) return;
        const payload = new FormData();
        Object.entries(profileData).forEach(([k,v]) => {
            if (k === 'disabilityCardImage') {
                if (v) payload.append(k, v);
            } else {
                payload.append(k, v);
            }
        });
        payload.append('disabilityMarks', JSON.stringify(selectedMarks));
        try {
            await fetch(`${API_BASE_URL}/user-profile`, {
                method: 'PATCH',
                credentials: 'include',
                body: payload,
            });
            setEditMode(false);
            fetchProfile();
        } catch (err) {
            console.error('Error saving profile:', err);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) return;
        try {
            await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error changing password:', err);
        }
    };

    const submitDisability = async (e) => {
        e.preventDefault();
        if (!profileData) return;
        const payload = new FormData();
        payload.append('disabilityCheck', profileData.disabilityCheck);
        payload.append('disabilityDegree', profileData.disabilityDegree || '');
        if (profileData.disabilityCardImage) {
            payload.append('disabilityCardImage', profileData.disabilityCardImage);
        }
        payload.append('disabilityMarks', JSON.stringify(selectedMarks));
        try {
            const res = await fetch(`${API_BASE_URL}/user-disability`, {
                method: 'POST',
                credentials: 'include',
                body: payload,
            });
            if (res.ok) {
                fetchProfile();
                setShowDisabilityForm(false);
            }
        } catch (err) {
            console.error('Error submitting disability request:', err);
        }
    };

    const deleteAccount = async () => {
        try {
            await fetch(`${API_BASE_URL}/delete-account`, {
                method: 'DELETE',
                credentials: 'include',
            });
            localStorage.removeItem('user');
            window.location.href = '/';
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    };

    return (
        <div className="profile-container">
            {/* Sidebar */}
            <aside className="sidebar">
                {["Meine Events", "Meine Bestellungen", "Help Center / FAQ"].map(label => (
                    <div
                        key={label}
                        className={`sidebar-item ${
                            activeSidebarItem === label ? "active" : ""
                        }`}
                        onClick={() => onSidebarClick(label)}
                    >
            <span className="icon">
              {label === "Mein EVENTIM"
                  ? "🏠"
                  : label === "Meine Events"
                      ? "🎫"
                      : "⭐"}
            </span>
                        <span>{label}</span>
                    </div>
                ))}
                <div style={{ flex: 1 }} />
                <div className="sidebar-footer">
                    <div className="sidebar-footer-title">Konto &amp; Einstellungen</div>
                    {["Meine Daten", "Abmelden"].map(label => (
                        <div
                            key={label}
                            className={`sidebar-item ${
                                activeSidebarItem === label ? "active" : ""
                            }`}
                            onClick={() => {
                                setActiveSidebarItem(label);
                                if (label === "Abmelden") {
                                    fetch(`${API_BASE_URL}/logout`, {
                                        method: 'POST',
                                        credentials: 'include'
                                    }).finally(() => {
                                        localStorage.removeItem('user');
                                        window.location.reload();
                                    });
                                } else {
                                    onSidebarClick(label);
                                }
                            }}
                        >
              <span className="icon">
                {label === "Meine Daten" ? "👤": "🚪"}
              </span>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="inner-container">

                    {/* „Meine Events“ */}
                    <div className="white-box events-white-box">
                        <div className="content-inner">
                            <div ref= {eventsRef} className="events-header">
                                <h1>Meine Events</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Alle bevorstehenden Events</p>
                        </div>
                        <div className="blue-placeholder">
                            <div className="content-inner">
                                <div className="cards-container">
                                    <div className="blue-cards">
                                        {blueCards.map(ev => (
                                            <SquareTourCard
                                                key={ev.event_id}
                                                imageId={ev.tour_image}
                                                title={ev.tour_title}
                                                bottomText={`${formatDate(ev.start_time)} | ${ev.venue_name}`}
                                                link={`/artists/${ev.artist_id}/${ev.tour_id}/${ev.event_id}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="white-box events-white-box">
                        <div className="content-inner">
                            <div ref= {ordersRef} className="events-header">
                                <h1>Meine Bestellungen</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Übersicht deiner Bestellungen</p>
                            <div className="content-inner">
                                {orders.length === 0 ? (
                                    <div className="no-orders" style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>Du hast noch keine Bestellungen.</p>
                                    </div>
                                ) : (
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Bestellungsnummer</th>
                                                <th>Bestellt am</th>
                                                <th>Anzahl d. Tickets</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((o, idx) => {
                                                const orderNo = orders.length - idx;
                                                const isSent = new Date(o.created_at).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000;
                                                return (
                                                    <tr
                                                        key={o.id}
                                                        className="order-row"
                                                        onClick={() => fetchOrderDetail(o.id)}
                                                    >
                                                        <td>#{orderNo}</td>
                                                        <td>{formatDate(o.created_at)} | {formatTime(o.created_at)}</td>
                                                        <td>{o.ticket_count}</td>
                                                        <td>
                                                            <span className={`order-status ${isSent ? 'send' : 'progress'}`}>{isSent ? 'In Zustellung' : 'In Bearbeitung'}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {selectedOrder && (
                                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                                        <h3>Bestellung #{orders.findIndex(o => o.id === selectedOrder.id) >= 0 ? orders.length - orders.findIndex(o => o.id === selectedOrder.id) : ''} </h3>
                                        <div className="order-detail-shipping">
                                            <p>[{formatDate(selectedOrder.order.created_at)} | {formatTime(selectedOrder.order.created_at)}]</p>
                                            <p>{selectedOrder.order.salutation} {selectedOrder.order.first_name} {selectedOrder.order.last_name}</p>
                                            <p>{selectedOrder.order.street_address}, {selectedOrder.order.postal_code} {selectedOrder.order.city}, {selectedOrder.order.country}</p>
                                        </div>
                                        <table className="tickets-table">
                                            <thead>
                                                <tr>
                                                    <th>Event</th>
                                                    <th>Kategorie</th>
                                                    <th></th>
                                                    <th>Sitz</th>
                                                    <th>QR-Code</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.tickets.map(t => (
                                                    <tr key={t.id}>
                                                        <td>{t.event_title}</td>
                                                        <td>{t.event_category}</td>
                                                        <td>{t.is_assistance_ticket ? <span className="assist-flag">B</span> : ''}</td>
                                                        <td>{t.seat_number}</td>
                                                        <td>
                                                            <a
                                                                href="#"
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    setQrTicketId(t.id);
                                                                }}
                                                            >
                                                                Ticket
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {qrTicketId && (
                                            <>
                                                <div className="qr-code-info">
                                                    <h3>QR-Code für Ihr Ticket:</h3>
                                                </div>
                                                <div className="qr-code-container" style={{ textAlign: 'center', margin: '1rem 0' }}>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrTicketId}&size=200x200`}
                                                        alt={`QR Code for ticket ${qrTicketId}`}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div className="modal-actions">
                                            <button className="profile__btn-cancel" style={{backgroundColor: "#ffc700"}} onClick={
                                                () => {
                                                    setQrTicketId(null);
                                                    setSelectedOrder(null);
                                                }
                                            }>Schließen</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="white-box events-white-box">
                        <div className="content-inner">
                            <div ref={dataRef} className="events-header" style={{ alignItems: 'center' }}>
                                <h1>Meine Daten</h1>
                                <span className="arrow">›</span>
                                <span
                                    className="edit-toggle"
                                    style={{ marginLeft: 'auto', cursor: 'pointer' }}
                                    onClick={() => setEditMode(!editMode)}
                                >
                                    {editMode ? '💾' : '✎'}
                                </span>
                            </div>
                            <p className="subtitle">Übersicht deiner gespeicherten Profildaten</p>
                        </div>
                        <div className="content-inner">
                            {profileData && (
                                editMode ? (
                                    <form onSubmit={saveProfile} className="profile-form">
                                        <div className="profile-form-field">
                                            <label htmlFor="salutation">Anrede</label>
                                            <select id="salutation" name="salutation" value={profileData.salutation} onChange={handleProfileChange}>
                                                <option value="">Bitte wählen</option>
                                                <option value="Herr">Herr</option>
                                                <option value="Frau">Frau</option>
                                                <option value="Dr.">Dr.</option>
                                                <option value="Prof.">Prof.</option>
                                                <option value="Divers">Divers</option>
                                            </select>
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="firstName">Vorname *</label>
                                            <input id="firstName" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required />
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="lastName">Nachname *</label>
                                            <input id="lastName" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required />
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="company">Firma</label>
                                            <input id="company" name="company" value={profileData.company || ''} onChange={handleProfileChange} />
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="streetAddress">Straße und Hausnummer *</label>
                                            <input id="streetAddress" name="streetAddress" value={profileData.streetAddress} onChange={handleProfileChange} required />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div className="profile-form-field" style={{ flex: 1 }}>
                                                <label htmlFor="postalCode">PLZ *</label>
                                                <input id="postalCode" name="postalCode" value={profileData.postalCode} onChange={handleProfileChange} required />
                                            </div>
                                            <div className="profile-form-field" style={{ flex: 2 }}>
                                                <label htmlFor="city">Stadt *</label>
                                                <input id="city" name="city" value={profileData.city} onChange={handleProfileChange} required />
                                            </div>
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="country">Land *</label>
                                            <input id="country" name="country" value={profileData.country} onChange={handleProfileChange} required />
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="birthDate">Geburtsdatum</label>
                                            <input type="date" id="birthDate" name="birthDate" value={profileData.birthDate || ''} onChange={handleProfileChange} />
                                        </div>
                                        <div className="profile-form-field">
                                            <label htmlFor="phone">Telefon</label>
                                            <input id="phone" name="phone" value={profileData.phone || ''} onChange={handleProfileChange} />
                                        </div>
                                        <div className="profile-form-buttons">
                                            <button type="submit" className="btn-confirm">Speichern</button>
                                            <button type="button" className="btn-cancel" onClick={() => { setEditMode(false); fetchProfile(); }}>Abbrechen</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="profile-data-view">
                                        <div className="label">Anrede</div><div className="value">{profileData.salutation || '-'}</div>
                                        <div className="label">Vorname</div><div className="value">{profileData.firstName}</div>
                                        <div className="label">Nachname</div><div className="value">{profileData.lastName}</div>
                                        <div className="label">Firma</div><div className="value">{profileData.company || '-'}</div>
                                        <div className="label">Straße</div><div className="value">{profileData.streetAddress}</div>
                                        <div className="label">PLZ</div><div className="value">{profileData.postalCode}</div>
                                        <div className="label">Stadt</div><div className="value">{profileData.city}</div>
                                        <div className="label">Land</div><div className="value">{profileData.country}</div>
                                        {profileData.birthDate && (<><div className="label">Geburtsdatum</div><div className="value">{profileData.birthDate}</div></>)}
                                        {profileData.phone && (<><div className="label">Telefon</div><div className="value">{profileData.phone}</div></>)}
                                    </div>
                                )
                            )}
                        </div>

                        <div className="content-inner">
                            <button className="btn-cancel" onClick={() => setDeletePrompt(true)}>Konto löschen</button>
                        </div>

                        {deletePrompt && (
                            <div className="modal-overlay" onClick={() => setDeletePrompt(false)}>
                                <div className="modal-box" onClick={e => e.stopPropagation()}>
                                    <p>Bitte tippe "Löschen" ein, um dein Konto zu löschen.</p>
                                    <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }} />
                                    <div className="modal-actions">
                                        <button className="btn-cancel" onClick={() => setDeletePrompt(false)}>Abbrechen</button>
                                        <button className="btn-confirm" onClick={deleteAccount} disabled={deleteText !== 'Löschen'}>Löschen</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="profile-section-divider" />

                        <div className="content-inner">
                            <h3>Passwort ändern</h3>
                            <form onSubmit={changePassword} className="profile-form">
                                <div className="profile-form-field">
                                    <label htmlFor="currentPassword">Aktuelles Passwort</label>
                                    <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                </div>
                                <div className="profile-form-field">
                                    <label htmlFor="newPassword">Neues Passwort</label>
                                    <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                </div>
                                <div className="profile-form-field">
                                    <label htmlFor="confirmPassword">Neues Passwort bestätigen</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                                </div>
                                <div className="profile-form-buttons">
                                    <button type="submit" className="btn-confirm">Ändern</button>
                                </div>
                            </form>
                        </div>

                        <div className="profile-section-divider" />

                        <div className="content-inner">
                            <h3>Antrag auf Nachteilsausgleich für Menschen mit Behinderung</h3>
                            {profileData && profileData.disabilityCheck ? (
                                <p className="success-message">Du bist bereits für den Nachteilsausgleich registriert.</p>
                            ) : showDisabilityForm ? (
                                <form onSubmit={submitDisability} className="profile-form">
                                    <div className="profile-form-field">
                                        <label htmlFor="disabilityDegree">Grad der Behinderung (0-100)</label>
                                        <input type="number" id="disabilityDegree" name="disabilityDegree" value={profileData.disabilityDegree || ''} onChange={handleProfileChange} min="0" max="100" />
                                    </div>
                                    <div className="profile-form-field">
                                        <label htmlFor="disabilityCardImage">Behindertenausweis hochladen</label>
                                        <input type="file" id="disabilityCardImage" name="disabilityCardImage" onChange={handleProfileChange} />
                                    </div>
                                    <div className="profile-form-field">
                                        <label>Grad der Behinderung – Markierungen</label>
                                        <div className="marks-grid">
                                            {disabilityMarks.map(mark => (
                                                <div key={mark.mark_code} className="mark-item">
                                                    <input type="checkbox" id={`mark-${mark.mark_code}`} className="mark-checkbox" checked={selectedMarks.includes(mark.mark_code)} onChange={() => toggleMark(mark.mark_code)} />
                                                    <label htmlFor={`mark-${mark.mark_code}`} className="mark-label">{mark.mark_code} – {mark.description}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="profile-form-buttons">
                                        <button type="submit" className="btn-confirm">Absenden</button>
                                        <button type="button" className="btn-cancel" onClick={() => setShowDisabilityForm(false)}>Abbrechen</button>
                                    </div>
                                </form>
                            ) : (
                                <button className="btn-confirm" onClick={() => setShowDisabilityForm(true)}>Jetzt registrieren</button>
                            )}
                        </div>
                    </div>

                    {/* Help Center / FAQ */}
                    <div className="white-box help-white-box">
                        <div className="content-inner">
                            <div ref={faqRef} className="events-header">
                                <h1>Help-Center // FAQ</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Die häufigst gestellten Fragen</p>
                            <div className="faq-placeholder">
                                <div>FAQ-Box 1</div>
                                <div>FAQ-Box 2</div>
                                <div>FAQ-Box 3</div>
                                <div>FAQ-Box 4</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
