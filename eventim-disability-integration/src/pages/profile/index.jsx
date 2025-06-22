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

const sampleTourData = [
    { imageId: "90bbc401-2984-494b-a34c-59831427a0b3", title: "Rod Stewart",         priceText: "Tickets ab € 68,00", link: "#" },
    { imageId: "f1d49502-0d05-4ea8-b347-2b22cac9ea65", title: "Tom Odell",           priceText: "Tickets ab € 60,40", link: "#" },
    { imageId: "d3b82c8c-4c08-4859-88a2-ca4cfebc08df", title: "Disney In Concert",   priceText: "Tickets ab € 59,90", link: "#" },
    { imageId: "82a3438f-83a4-475a-90a3-fc9fe951faac", title: "Schwanensee – Ballett", priceText: "Tickets ab € 42,00", link: "#" },
    { imageId: "5da11a45-7366-42dc-8604-e81851271b25", title: "Ehrlich Brothers",    priceText: "Tickets ab € 52,00", link: "#" },
    { imageId: "1dd71154-1920-4c77-99f1-94e08572eb78", title: "Tom Gaebel",          priceText: "Tickets ab € 39,90", link: "#" },
    { imageId: "68368c8c-2094-463a-8698-adea0440b44c", title: "Teddy Teclebrhan",    priceText: "Tickets ab € 42,25", link: "#" },
    { imageId: "9fde1a84-3a64-4a0a-9210-7c9bb3dcb7e5", title: "Lars Eidinger",       priceText: "Tickets ab € 35,00", link: "#" },
];

export default function ProfilePage() {
    // Carousel indices
    const [carouselIndex, setCarouselIndex] = useState(0);
    // How many cards fit side‐by‐side? 1 – 8
    const [visibleCount, setVisibleCount] = useState(1);
    const carouselRef = useRef(null);

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [qrTicketId, setQrTicketId] = useState(null);

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
            setCarouselIndex(ci => Math.min(ci, sampleTourData.length - clamp));
        }
        updateCount();
        window.addEventListener("resize", updateCount);
        return () => window.removeEventListener("resize", updateCount);
    }, []);

    const handlePrev = () => {
        if (carouselIndex > 0) setCarouselIndex(i => i - 1);
    };
    const handleNext = () => {
        if (carouselIndex < sampleTourData.length - visibleCount)
            setCarouselIndex(i => i + 1);
    };

    // Slices for blue cards (Meine Events) and recommendations
    const blueCards = sampleTourData.slice(0, visibleCount);
    const recommendCards = sampleTourData.slice(
        carouselIndex,
        carouselIndex + visibleCount
    );

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

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
                                        {blueCards.map(t => (
                                            <SquareTourCard key={t.imageId} {...t} />
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
                                        {recommendCards.map((t, i) => (
                                            <SquareTourCard
                                                key={carouselIndex + i}
                                                {...t}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="carousel-button right"
                                        onClick={handleNext}
                                        disabled={
                                            carouselIndex >= sampleTourData.length - visibleCount
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
