// checkout/index.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config'; // adjust path if needed

export default function Checkout() {
    const [items, setItems] = useState([]);
    const [createdAt, setCreatedAt] = useState(null);
    const [timer, setTimer] = useState(0);
    const offsetRef = useRef(0);   // serverTime - localTime

    // Helper: fetch checkout data
    const fetchCheckout = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/checkout-items`, {
                credentials: 'include'
            });
            if (res.status === 404) {
                // no checkout → back home
                window.location.href = '/';
                return;
            }
            const { createdAt: serverCreatedAt, items: fetchedItems } = await res.json();
            // ensure items is always an array
            setItems(Array.isArray(fetchedItems) ? fetchedItems : []);

            // sync clocks: get serverNow from headers or fallback to local
            const localNow = Date.now();
            const serverNow = localNow;
            offsetRef.current = serverNow - localNow;

            setCreatedAt(new Date(serverCreatedAt).getTime());
        } catch (err) {
            console.error('Error fetching checkout:', err);
        }
    };

    // 1) initial fetch + poll every 15s
    useEffect(() => {
        fetchCheckout();
        const poll = setInterval(fetchCheckout, 15_000);
        return () => clearInterval(poll);
    }, []);

    // 2) local countdown every second
    useEffect(() => {
        if (!createdAt) return;
        const iv = setInterval(() => {
            const now = Date.now() + offsetRef.current;
            const elapsed = Math.floor((now - createdAt) / 1000);
            const remaining = 15 * 60 - elapsed;
            if (remaining <= 0) {
                clearInterval(iv);
                // cleanup on expiration
                fetch(`${API_BASE_URL}/checkout`, {
                    method: 'DELETE',
                    credentials: 'include'
                }).finally(() => {
                    alert('Deine Reservierungszeit ist abgelaufen.');
                    window.location.href = '/';
                });
            } else {
                setTimer(remaining);
            }
        }, 1000);
        return () => clearInterval(iv);
    }, [createdAt]);

    const formatTimer = s => {
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec} Min.`;
    };

    // 3) Delete single item
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/checkout-items/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                await fetchCheckout();
            } else {
                alert('Fehler beim Löschen des Tickets.');
            }
        } catch (err) {
            console.error(err);
            alert('Netzwerkfehler.');
        }
    };

    // guard against undefined
    const subtotal = (items || []).reduce((sum, t) => sum + t.price * t.quantity, 0);

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="checkoutPage__container" >
            <div className="checkoutPage__item" style={{paddingLeft: '15px'}}>
                <div className="checkoutPage__header">Bestellübersicht</div>
                {items.map(t => {
                    const {
                        id,
                        eventId,
                        startTime,
                        category,
                        eventTitle,
                        eventVenue,
                        eventCity,
                        image,
                        quantity,
                        price
                    } = t;

                    return (
                        <div key={id} className="checkoutPage__item">
                            <div className="checkoutPage__item-header">
                                <img
                                    src={
                                        image
                                            ? `${API_BASE_URL}/image/${image}`
                                            : '/images/placeholder.jpg'
                                    }
                                    alt={eventTitle}
                                    width={120}
                                    height={120}
                                />
                                <div className="checkoutPage__item-info">
                                    <h2 style={{fontWeight: "bold"}}>{quantity} × <a className="venue-link" href="#" style={{color: "black"}}>{eventTitle}</a> — {category}</h2>
                                    <div className="meta-item">
                                        <span className="icon-location" /> {eventCity} |{' '}
                                        <a href="#" className="venue-link" style={{color: "black"}}>{eventVenue}</a>
                                    </div>
                                    <div className="meta-item">
                                        <span className="icon-calendar" />
                                        {formatDate(startTime)} | {formatTime(startTime)} Uhr
                                    </div>
                                </div>
                            </div>
                            <button
                                className="checkoutPage__delete-btn"
                                onClick={() => handleDelete(id)}
                                aria-label="Ticket löschen"
                            >×</button>
                        </div>
                    );
                })}
            </div>

            <div className="checkoutPage__sidebar">
                <div className="checkoutPage__reservation-box">
                    Deine Tickets sind noch erhältlich<br/>
                    ⏱ Reservierungszeit: {formatTimer(timer)}
                </div>

                <div className="checkoutPage__order-summary">
                    <h3>Bestellübersicht</h3>
                    {items.map(t => (
                        <div key={t.id} className="checkoutPage__order-item">
                            <span>{t.quantity} × {t.eventTitle}</span>
                            <span>€ {(t.price * t.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="checkoutPage__order-subtotal">
                        <span>Zwischensumme</span>
                        <span>€ {subtotal.toFixed(2)}</span>
                    </div>
                    <small>inkl. MwSt., zzgl. Versandkosten</small>
                    <button className="checkoutPage__checkout-button">
                        Weiter zur Kasse
                    </button>
                </div>

                <div className="checkoutPage__payment-methods">
                    <img src="/pictures/payment-methods/sepa.svg" alt="SEPA Lastschrift" />
                    <img src="/pictures/payment-methods/visa_master_amex.svg" alt="VISA" />
                    <img src="/pictures/payment-methods/paypal.svg" alt="PayPal" />
                    <img src="/pictures/payment-methods/gpay_apay.svg" alt="Google Pay & Apple Pay" />
                    <img src="/pictures/payment-methods/klarna.svg" alt="Klarna" />
                </div>
            </div>
        </div>
    );
}