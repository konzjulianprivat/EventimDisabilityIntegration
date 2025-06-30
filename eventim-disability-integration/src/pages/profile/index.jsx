// pages/profile/shopping-cart.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import SquareTourCard from "../../components/squareTourCard";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../hooks/useAuth";
import DeleteAccountModal from "../../components/DeleteAccountModal.jsx";
import FaqCard from "../../components/FaqCard.jsx";

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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

    const { loading: authLoading, user } = useAuth();

    // --------------------------------------------
    // Meine Daten section state
    // --------------------------------------------
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
        phone: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [disabilityDegree, setDisabilityDegree] = useState('');
    const [disabilityCardImageFront, setDisabilityCardImageFront] = useState(null);
    const [disabilityCardImageBack, setDisabilityCardImageBack] = useState(null);
    const [disabilityCardExpiryDate, setDisabilityCardExpiryDate] = useState('9999-01-01');
    const [hasExpiry, setHasExpiry] = useState(false);
    const [marks, setMarks] = useState([]);
    const [selectedMarks, setSelectedMarks] = useState([]);
    const [showDisabilityForm, setShowDisabilityForm] = useState(false);

    const [activeSidebarItem, setActiveSidebarItem] = useState("Meine Events");
    // refs for each section
    const eventsRef = useRef(null);
    const ordersRef = useRef(null);
    const personalDataRef = useRef(null);
    const faqRef    = useRef(null);
    const mainContentRef = useRef(null);

    const scrollTo = ref => {
        if (ref?.current && mainContentRef.current) {
            const container = mainContentRef.current;
            const offset = window.innerHeight * 0.10;
            const rect = ref.current.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const y = container.scrollTop + rect.top - containerRect.top - offset;
            container.scrollTo({ top: y, behavior: "smooth" });
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
                scrollTo(personalDataRef);
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

    // --------------------------------------------
    // Meine Daten helper functions
    // --------------------------------------------
    const fetchProfileData = async () => {
        try {
            const [sessionRes, addrRes] = await Promise.all([
                fetch(`${API_BASE_URL}/session-status`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/user-address`,   { credentials: 'include' })
            ]);

            if (sessionRes.ok) {
                const js = await sessionRes.json();
                if (js.user) {
                    setProfileData(prev => ({
                        ...prev,
                        firstName: js.user.firstName || '',
                        lastName:  js.user.lastName  || '',
                        email:     js.user.email     || ''
                    }));
                    setSelectedMarks(Array.isArray(js.user.disabilityMarks) ? js.user.disabilityMarks : []);
                }
            }

            if (addrRes.ok) {
                const data = await addrRes.json();
                if (data.address) {
                    const a = data.address;
                    setProfileData(prev => ({
                        ...prev,
                        salutation:   a.salutation    || '',
                        company:      a.company       || '',
                        streetAddress: a.street_address || '',
                        postalCode:   a.postal_code   || '',
                        city:         a.city          || '',
                        country:      a.country       || 'Deutschland'
                    }));
                }
            }
        } catch (err) {
            console.error('Error loading profile data:', err);
        }
    };

    const fetchMarks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/disability-marks`);
            if (res.ok) {
                const json = await res.json();
                setMarks(Array.isArray(json.marks) ? json.marks : []);
            }
        } catch (err) {
            console.error('Error fetching disability marks:', err);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChangeField = e => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const toggleMark = (code) => {
        setSelectedMarks(prev => prev.includes(code)
            ? prev.filter(m => m !== code)
            : [...prev, code]);
    };

    const saveProfile = async () => {
        try {
            await fetch(`${API_BASE_URL}/users/${user.userId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            setEditMode(false);
        } catch (err) {
            console.error('Error updating profile:', err);
        }
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) return;
        try {
            await fetch(`${API_BASE_URL}/users/${user.userId}/password`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error changing password:', err);
        }
    };

    const submitDisability = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('requestForDisability', true);
        fd.append('disabilityDegree', disabilityDegree);
        fd.append('disabilityCardExpiryDate', disabilityCardExpiryDate);
        fd.append('isCurrentlyDisabled', false);
        if (disabilityCardImageFront) {
            fd.append('disabilityCardImageFront', disabilityCardImageFront);
        }
        if (disabilityCardImageBack) {
            fd.append('disabilityCardImageBack', disabilityCardImageBack);
        }
        fd.append('disabilityMarks', JSON.stringify(selectedMarks));
        try {
            await fetch(`${API_BASE_URL}/users/${user.userId}/disability`, {
                method: 'PATCH',
                credentials: 'include',
                body: fd
            });
            setShowDisabilityForm(false);
        } catch (err) {
            console.error('Error submitting disability data:', err);
        }
    };

    const deleteAccount = async () => {
        if (deleteInput !== 'Löschen') return;
        try {
            await fetch(`${API_BASE_URL}/users/${user.userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            window.location.href = '/';
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchMyEvents();
        fetchProfileData();
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

    return (
        <div className="profile-container">
            {/* Sidebar */}
            <aside className="sidebar">
                {["Meine Events", "Meine Bestellungen", "Meine Daten", "Help Center / FAQ"].map(label => (
                    <div
                        key={label}
                        className={`sidebar-item ${
                            activeSidebarItem === label ? "active" : ""
                        }`}
                        onClick={() => onSidebarClick(label)}
                    >
            <span className="icon">
              {label === "Meine Events"
                  ? "🏠"
                  : label === "Meine Bestellungen"
                      ? "🎫"
                      : "⭐"}
            </span>
                        <span>{label}</span>
                    </div>
                ))}
                <div style={{ flex: 1 }} />
                <div className="sidebar-footer">
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" ref={mainContentRef}>
                <div className="inner-container">

                    {/* „Meine Events“ */}
                    <div className="white-box events-white-box">
                        <div className="content-inner">
                            <div ref= {eventsRef} className="events-header">
                                <h1>Meine Events</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Alle bevorstehenden Events</p>
                            <div className="content-inner">
                                {myEvents.length === 0 ? (
                                    <div className="no-orders" style={{ padding: '2rem', textAlign: 'center'}}>
                                        <p>Du hast aktuell keine bevorstehenden Events.</p>
                                    </div>
                                ) : (
                                    <div className="blue-placeholder">
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
                                )}
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
                                <div ref={personalDataRef} className="events-header" style={{ display: 'flex', alignItems: 'center' }}>
                                    <h1>Meine Daten</h1>
                                    <span className="arrow">›</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(!editMode)}
                                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        aria-label="Edit profile"
                                    >
                                        {editMode ? '' : '✎'}
                                    </button>
                                </div>
                                <p className="subtitle">Übersicht deiner gespeicherten Profildaten</p>

                                <div className="content-inner">
                                    <form className="profile-data-form" onSubmit={e => { e.preventDefault(); saveProfile(); }}>
                                        <div className="form-field">
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
                                                <div className="profile-data-display">{profileData.salutation || '-'}</div>
                                            )}
                                        </div>

                                        {['firstName', 'lastName', 'company', 'streetAddress'].map((field) => (
                                            <div key={field} className="form-field">
                                                <label htmlFor={field}>{{
                                                    firstName: 'Vorname',
                                                    lastName: 'Nachname',
                                                    company: 'Firma',
                                                    streetAddress: 'Straße und Hausnummer',
                                                }[field]}</label>
                                                {editMode ? (
                                                    <input
                                                        id={field}
                                                        name={field}
                                                        value={profileData[field] || ''}
                                                        onChange={handleProfileChange}
                                                    />
                                                ) : (
                                                    <div className="profile-data-display">{profileData[field] || '-'}</div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="form-field" style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label htmlFor="postalCode">PLZ</label>
                                                {editMode ? (
                                                    <input id="postalCode" name="postalCode" value={profileData.postalCode} onChange={handleProfileChange} />
                                                ) : (
                                                    <div className="profile-data-display">{profileData.postalCode || '-'}</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 2 }}>
                                                <label htmlFor="city">Stadt</label>
                                                {editMode ? (
                                                    <input id="city" name="city" value={profileData.city} onChange={handleProfileChange} />
                                                ) : (
                                                    <div className="profile-data-display">{profileData.city || '-'}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="country">Land</label>
                                            {editMode ? (
                                                <input id="country" name="country" value={profileData.country} onChange={handleProfileChange} />
                                            ) : (
                                                <div className="profile-data-display">{profileData.country || '-'}</div>
                                            )}
                                        </div>

                                        {['email', 'birthDate', 'phone'].map((field) => (
                                            <div key={field} className="form-field">
                                                <label htmlFor={field}>{{
                                                    email: 'E-Mail',
                                                    birthDate: 'Geburtsdatum',
                                                    phone: 'Telefon',
                                                }[field]}</label>
                                                {editMode ? (
                                                    <input
                                                        type={field === 'birthDate' ? 'date' : 'text'}
                                                        id={field}
                                                        name={field}
                                                        value={profileData[field] || ''}
                                                        onChange={handleProfileChange}
                                                    />
                                                ) : (
                                                    <div className="profile-data-display">{profileData[field] || '-'}</div>
                                                )}
                                            </div>
                                        ))}
                                        {editMode && (
                                            <div className="form-actions">
                                                <button type="submit" className="profile__btn-cancel">
                                                    Speichern
                                                </button>
                                            </div>
                                        )}
                                    </form>

                                    <button
                                        type="button"
                                        className="profile__btn-cancel"
                                        style={{ marginTop: '1rem', backgroundColor: 'red' }}
                                        onClick={() => setShowDeleteModal(true)}
                                      >
                                        Account löschen
                                      </button>
                                </div>

                                  {/* our new modal */}
                                  <DeleteAccountModal
                                    visible={showDeleteModal}
                                    inputValue={deleteConfirmInput}
                                    setInputValue={setDeleteConfirmInput}
                                    onCancel={() => {
                                      setShowDeleteModal(false);
                                      setDeleteConfirmInput("");
                                    }}
                                    onConfirm={() => {
                                      deleteAccount();
                                      setShowDeleteModal(false);
                                    }}
                                  />
                                <div className="profile-section-divider" />

                                <div className="events-header" style={{ display: 'flex', alignItems: 'center' }}>
                                    <h3>Passwort ändern</h3>
                                    <span className="arrow">›</span>
                                </div>
                                <div className="content-inner">
                                    <form className="profile-data-form" onSubmit={submitPasswordChange}>
                                        <div className="form-field">
                                            <label htmlFor="currentPassword">Aktuelles Passwort</label>
                                            <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChangeField} />
                                        </div>
                                        <div className="form-field">
                                            <label htmlFor="newPassword">Neues Passwort</label>
                                            <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChangeField} />
                                        </div>
                                        <div className="form-field">
                                            <label htmlFor="confirmPassword">Neues Passwort wiederholen</label>
                                            <input type="password" id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChangeField} />
                                        </div>
                                        <button className="profile__btn-cancel" type="submit">Passwort ändern</button>
                                    </form>
                                </div>

                                <div className="profile-section-divider" />

                                <div className="events-header" style={{ display: 'flex', alignItems: 'center' }}>
                                    <h3>Antrag auf Nachteilsausgleich für Menschen mit Behinderung</h3>
                                    <span className="arrow">›</span>
                                </div>
                                <p className="subtitle">Wenn du einen Schwerbehindertenausweis besitzt und einen Nachteilsausgleich benötigst, kannst du diesen hier beantragen.</p>
                            <div className="content-inner">
                                {user?.requestForDisability ? (
                                    user?.isCurrentlyDisabled ? (
                                        <div className="no-orders" style={{color: "#28a745", backgroundColor: "#e6f4ea"}}>
                                            Dein Nachteilsausgleich wurde genehmigt, du hast die Möglichkeit, auf deine Bedürfnisse abgestimmte Events zu buchen
                                        </div>
                                    ) : (
                                        <div className="no-orders" style={{color: "#856404", backgroundColor: "#fff3cd"}}>
                                            Dein Antrag ist eingetroffen und wird von einem unserer Servicemitarbeiter bearbeitet.
                                        </div>
                                    )
                                ) : (
                                    <>
                                        {showDisabilityForm ? (
                                            <form className="profile-data-form" onSubmit={submitDisability} style={{gridTemplateColumns: "repeat(2, 1fr)"}}>
                                                <div className="form-field">
                                                    <label htmlFor="disabilityDegree">Grad der Behinderung (0-100)</label>
                                                    <input type="number" id="disabilityDegree" value={disabilityDegree} onChange={e => setDisabilityDegree(e.target.value)} min="0" max="100" />
                                                </div>
                                                <br/>
                                                <div className="form-field">
                                                    <label htmlFor="disabilityCardImageFront">Behindertenausweis hochladen (Vorderseite)</label>
                                                    <input type="file" id="disabilityCardImageFront" onChange={e => setDisabilityCardImageFront(e.target.files[0])} />
                                                </div>
                                                <div className="form-field">
                                                    <label htmlFor="disabilityCardImageBack">Behindertenausweis hochladen (Rückseite)</label>
                                                    <input type="file" id="disabilityCardImageBack" onChange={e => setDisabilityCardImageBack(e.target.files[0])} />
                                                </div>
                                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                                    <label>Gültigkeit des Ausweises</label>
                                                    <div className="toggle-container" style={{marginBottom: '0.5rem'}}>
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                id="hasExpiryProfile"
                                                                checked={hasExpiry}
                                                                onChange={(e) => {
                                                                    setHasExpiry(e.target.checked);
                                                                    if (!e.target.checked) {
                                                                        setDisabilityCardExpiryDate('9999-01-01');
                                                                    } else {
                                                                        const t = new Date().toISOString().split('T')[0];
                                                                        setDisabilityCardExpiryDate(t);
                                                                    }
                                                                }}
                                                            />
                                                            <span className="slider" />
                                                        </label>
                                                        <span className="toggle-label">
                                                            {hasExpiry ? 'befristet' : 'unbefristet'}
                                                        </span>
                                                    </div>
                                                    {hasExpiry && (
                                                        <input
                                                            type="date"
                                                            id="disabilityCardExpiryDateProfile"
                                                            value={disabilityCardExpiryDate}
                                                            onChange={e => setDisabilityCardExpiryDate(e.target.value)}
                                                            style={{ marginTop: '0.5rem' }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                                    <label className="marks__heading">Grad der Behinderung – Markierungen</label>
                                                    <div className="marks-grid">
                                                        {marks.map(m => {
                                                            const isSelected = selectedMarks.includes(m.mark_code);
                                                            return (
                                                                <div
                                                                    key={m.mark_code}
                                                                    className={`mark-card ${isSelected ? 'mark-card--selected' : ''}`}
                                                                    onClick={() => toggleMark(m.mark_code)}
                                                                >
                                                                    {/* keep checkbox for a11y/logic, but visually hidden */}
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`m-${m.mark_code}`}
                                                                        checked={isSelected}
                                                                        onChange={() => toggleMark(m.mark_code)}
                                                                        className="mark-card__checkbox"
                                                                    />
                                                                    <label htmlFor={`m-${m.mark_code}`} className="mark-card__label">
                                                                        <span className="mark-card__desc">{m.mark_code} – {m.description}</span>
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <button type="submit" className="profile__btn-cancel">Antrag abschicken</button>
                                            </form>
                                        ) : (
                                            <button type="button" className="profile__btn-cancel" onClick={() => setShowDisabilityForm(true)}>
                                                Antrag auf Nachteilsausgleich für Menschen mit Behinderung
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
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
                                <div className="content-inner">
                                    <div className="faq-placeholder">
                                        <FaqCard question="Wo finde ich die Tickets zu meinen Events?" answer="Gehen Sie unter Bestellungen auf die einzelne Bestellung klicken Sie auf Ticket anzeigen, der QR-Code zum Einlass wird ihnen angezeigt." />
                                        <FaqCard question="Kann ich meine Tickets auch telefonisch buchen?" answer="Telefonisch kannst du Tickets über unsere Ticket-Hotline erwerben. Diese ist von Montag bis Samstag von 09:00 bis 18:00 Uhr erreichbar (0,20 €/Anruf inkl. MwSt.)." />
                                        <FaqCard question="Ich bin schwerbehindert - muss ich meine Tickets Telefonisch über die Hotline buchen?" answer="Musst du nicht! Durch unsere neuste Integration kannst du deine Tickets bequem über unsere Webseite buchen - fülle dafür den Antrag auf Nachteilsausgleich aus!" />
                                        <FaqCard question="Ich will mich bei den Entwicklern der Seite bedanken, wie kann ich dem Team eine Freude bereiten?" answer="Gehen Sie dafür einfach auf Dualis und reichen Sie der Gruppe C die maximale Anzahl an Punkten ein ;)." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </main>
        </div>
);
}

