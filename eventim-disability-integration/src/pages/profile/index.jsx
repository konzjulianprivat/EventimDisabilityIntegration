// pages/profile/shopping-cart.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import SquareTourCard from "../../components/squareTourCard";
import { API_BASE_URL } from "../../config";

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

    const fetchTours = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tours-detailed`);
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

    useEffect(() => {
        fetchOrders();
        fetchMyEvents();
        fetchTours();
    }, []);

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

                        {/* Empfehlungen */}
                        <div className="content-inner">
                            <h3>Empfehlungen basierend auf deinen letzten Buchungen</h3>
                            <div
                                className="carousel-container"
                                ref={carouselRef}
                                style={{marginTop: "1rem"}}
                            >
                                <div className="carousel-wrapper">
                                    <button
                                        className="carousel-button left"
                                        onClick={handlePrev}
                                        disabled={carouselIndex === 0}
                                    >
                                        ‹
                                    </button>
                                    <div className="carousel-track">
                                        {recommendCards.map((t, i) => {
                                            const ev = t.events && t.events[0];
                                            if (!ev) return null;
                                            return (
                                                <SquareTourCard
                                                    key={carouselIndex + i}
                                                    imageId={t.tour_image}
                                                    title={t.title}
                                                    bottomText={`${formatDate(ev.start_time)} | ${ev.venueName}`}
                                                    link={`/artists/${t.artistIds && t.artistIds[0]}/${t.id}/${ev.id}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <button
                                        className="carousel-button right"
                                        onClick={handleNext}
                                        disabled={
                                            carouselIndex >= tours.length - visibleCount
                                        }
                                    >
                                        ›
                                    </button>
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
