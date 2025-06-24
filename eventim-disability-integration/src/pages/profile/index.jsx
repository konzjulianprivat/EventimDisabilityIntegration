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

    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        salutation: '',
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        streetAddress: '',
        postalCode: '',
        city: '',
        country: 'Deutschland',
        birthDate: '',
        phone: ''
    });
    const [pwData, setPwData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showDisability, setShowDisability] = useState(false);
    const [disabilityData, setDisabilityData] = useState({
        disabilityDegree: '',
        disabilityCardImage: null
    });
    const [disabilityMarks, setDisabilityMarks] = useState([]);
    const [selectedMarks, setSelectedMarks] = useState([]);
    const [infoMsg, setInfoMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [activeSidebarItem, setActiveSidebarItem] = useState("Meine Events");
    // refs for each section
    const eventsRef = useRef(null);
    const ordersRef = useRef(null);
    const faqRef    = useRef(null);

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
            const res = await fetch(`${API_BASE_URL}/user-address`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                setProfileData(prev => ({
                    ...prev,
                    salutation: addr.salutation || '',
                    firstName: addr.first_name || user?.firstName || '',
                    lastName: addr.last_name || user?.lastName || '',
                    email: user?.email || '',
                    company: addr.company || '',
                    streetAddress: addr.street_address || '',
                    postalCode: addr.postal_code || '',
                    city: addr.city || '',
                    country: addr.country || 'Deutschland'
                }));
            }
        } catch (err) {
            console.error('Error fetching profile data:', err);
        }
    };

    const fetchDisabilityMarks = async () => {
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

    const handleProfileChange = e => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePwChange = e => {
        const { name, value } = e.target;
        setPwData(prev => ({ ...prev, [name]: value }));
    };

    const handleDisabilityChange = e => {
        const { name, value, files } = e.target;
        if (e.target.type === 'file') {
            setDisabilityData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setDisabilityData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMarkToggle = code => {
        setSelectedMarks(prev => prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code]);
    };

    const handleSaveProfile = async e => {
        e.preventDefault();
        setInfoMsg('');
        setErrorMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/user`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                setInfoMsg('Daten gespeichert');
                setEditMode(false);
            } else {
                const d = await res.json();
                setErrorMsg(d.message || 'Speichern fehlgeschlagen');
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setErrorMsg('Serverfehler');
        }
    };

    const handlePasswordChange = async e => {
        e.preventDefault();
        setInfoMsg('');
        setErrorMsg('');
        if (pwData.newPassword !== pwData.confirmPassword) {
            setErrorMsg('Passwörter stimmen nicht überein');
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/user-password`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pwData)
            });
            if (res.ok) {
                setInfoMsg('Passwort geändert');
                setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const d = await res.json();
                setErrorMsg(d.message || 'Änderung fehlgeschlagen');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setErrorMsg('Serverfehler');
        }
    };

    const handleDisabilitySubmit = async e => {
        e.preventDefault();
        setInfoMsg('');
        setErrorMsg('');
        const fd = new FormData();
        fd.append('disabilityDegree', disabilityData.disabilityDegree);
        if (disabilityData.disabilityCardImage) {
            fd.append('disabilityCardImage', disabilityData.disabilityCardImage);
        }
        fd.append('disabilityMarks', JSON.stringify(selectedMarks));
        try {
            const res = await fetch(`${API_BASE_URL}/register-disability`, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });
            if (res.ok) {
                setInfoMsg('Antrag gesendet');
                setShowDisability(false);
            } else {
                const d = await res.json();
                setErrorMsg(d.message || 'Fehler beim Senden');
            }
        } catch (err) {
            console.error('Error sending disability data:', err);
            setErrorMsg('Serverfehler');
        }
    };

    const handleDeleteAccount = async () => {
        const conf = window.prompt('Zum Bestätigen tippe "Löschen"');
        if (conf !== 'Löschen') return;
        try {
            await fetch(`${API_BASE_URL}/delete-user`, { method: 'DELETE', credentials: 'include' });
            window.location.href = '/';
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchMyEvents();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        const marks = (user && user.disabilityMarks) || [];
        fetchTours(marks);
        fetchProfile();
    }, [authLoading, user]);

    useEffect(() => {
        if (showDisability) fetchDisabilityMarks();
    }, [showDisability]);

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
                            onClick={() => setActiveSidebarItem(label)}
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
                            <div ref={eventsRef} className="events-header" style={{ display: 'flex', alignItems: 'center' }}>
                                <h1>Meine Daten</h1>
                                <span className="arrow">›</span>
                                <span className="edit-toggle" onClick={() => setEditMode(e => !e)}>{editMode ? '✖' : '✏️'}</span>
                            </div>
                            <p className="subtitle">Übersicht deiner gespeicherten Profildaten</p>
                            {infoMsg && <div className="success-message">{infoMsg}</div>}
                            {errorMsg && <div className="error-message">{errorMsg}</div>}
                            <form className="profile-data-form" onSubmit={handleSaveProfile}>
                                <div className="form-row">
                                    <label htmlFor="salutation">Anrede</label>
                                    {editMode ? (
                                        <select id="salutation" name="salutation" value={profileData.salutation} onChange={handleProfileChange}>
                                            <option value="">Bitte wählen</option>
                                            <option value="Herr">Herr</option>
                                            <option value="Frau">Frau</option>
                                            <option value="Dr.">Dr.</option>
                                            <option value="Prof.">Prof.</option>
                                            <option value="Divers">Divers</option>
                                        </select>
                                    ) : (
                                        <div className="display-value">{profileData.salutation}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="firstName">Vorname</label>
                                    {editMode ? (
                                        <input type="text" id="firstName" name="firstName" value={profileData.firstName} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.firstName}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="lastName">Nachname</label>
                                    {editMode ? (
                                        <input type="text" id="lastName" name="lastName" value={profileData.lastName} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.lastName}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="company">Firma</label>
                                    {editMode ? (
                                        <input type="text" id="company" name="company" value={profileData.company} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.company}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="streetAddress">Straße und Hausnummer</label>
                                    {editMode ? (
                                        <input type="text" id="streetAddress" name="streetAddress" value={profileData.streetAddress} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.streetAddress}</div>
                                    )}
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: '1' }}>
                                        <label htmlFor="postalCode">PLZ</label>
                                        {editMode ? (
                                            <input type="text" id="postalCode" name="postalCode" value={profileData.postalCode} onChange={handleProfileChange} />
                                        ) : (
                                            <div className="display-value">{profileData.postalCode}</div>
                                        )}
                                    </div>
                                    <div style={{ flex: '2' }}>
                                        <label htmlFor="city">Stadt</label>
                                        {editMode ? (
                                            <input type="text" id="city" name="city" value={profileData.city} onChange={handleProfileChange} />
                                        ) : (
                                            <div className="display-value">{profileData.city}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label htmlFor="country">Land</label>
                                    {editMode ? (
                                        <input type="text" id="country" name="country" value={profileData.country} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.country}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="birthDate">Geburtsdatum</label>
                                    {editMode ? (
                                        <input type="date" id="birthDate" name="birthDate" value={profileData.birthDate} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.birthDate}</div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <label htmlFor="phone">Telefon</label>
                                    {editMode ? (
                                        <input type="tel" id="phone" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                                    ) : (
                                        <div className="display-value">{profileData.phone}</div>
                                    )}
                                </div>
                                {editMode && (
                                    <button type="submit" className="profile__btn-cancel" style={{ backgroundColor: '#002b55', color: '#fff' }}>Speichern</button>
                                )}
                            </form>

                            <button type="button" className="profile__btn-cancel" onClick={handleDeleteAccount}>Konto löschen</button>

                            <div className="profile-section-divider" />

                            <form className="profile-data-form" onSubmit={handlePasswordChange}>
                                <div className="form-row">
                                    <label htmlFor="oldPassword">Aktuelles Passwort</label>
                                    <input type="password" id="oldPassword" name="oldPassword" value={pwData.oldPassword} onChange={handlePwChange} required />
                                </div>
                                <div className="form-row">
                                    <label htmlFor="newPassword">Neues Passwort</label>
                                    <input type="password" id="newPassword" name="newPassword" value={pwData.newPassword} onChange={handlePwChange} required />
                                </div>
                                <div className="form-row">
                                    <label htmlFor="confirmPassword">Neues Passwort wiederholen</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={pwData.confirmPassword} onChange={handlePwChange} required />
                                </div>
                                <button type="submit" className="profile__btn-cancel" style={{ backgroundColor: '#002b55', color: '#fff' }}>Passwort ändern</button>
                            </form>

                            <div className="profile-section-divider" />

                            {user?.disabilityCheck ? (
                                <div className="success-message">Du bist bereits für einen Nachteilsausgleich registriert.</div>
                            ) : (
                                <>
                                    {!showDisability && (
                                        <button type="button" className="profile__btn-cancel" onClick={() => setShowDisability(true)}>
                                            Antrag auf Nachteilsausgleich für Menschen mit Behinderung
                                        </button>
                                    )}
                                    {showDisability && (
                                        <form className="profile-data-form" onSubmit={handleDisabilitySubmit}>
                                            <div className="form-row">
                                                <label htmlFor="disabilityDegree">Grad der Behinderung (0-100)</label>
                                                <input type="number" id="disabilityDegree" name="disabilityDegree" min="0" max="100" value={disabilityData.disabilityDegree} onChange={handleDisabilityChange} />
                                            </div>
                                            <div className="form-row">
                                                <label htmlFor="disabilityCardImage">Behindertenausweis hochladen</label>
                                                <input type="file" id="disabilityCardImage" name="disabilityCardImage" onChange={handleDisabilityChange} />
                                            </div>
                                            <div className="form-row">
                                                <label>Grad der Behinderung – Markierungen</label>
                                                <div className="marks-grid">
                                                    {disabilityMarks.map(mark => (
                                                        <div key={mark.mark_code} className="mark-item">
                                                            <input type="checkbox" id={`mark-${mark.mark_code}`} className="mark-checkbox" checked={selectedMarks.includes(mark.mark_code)} onChange={() => handleMarkToggle(mark.mark_code)} />
                                                            <label htmlFor={`mark-${mark.mark_code}`} className="mark-label">{mark.mark_code} – {mark.description}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button type="submit" className="profile__btn-cancel" style={{ backgroundColor: '#002b55', color: '#fff' }}>Absenden</button>
                                        </form>
                                    )}
                                </>
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
