// checkout/shopping-cart.jsx
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
            <div className="checkoutPage__item" style={{paddingLeft: '15px', minWidth: '350px'}}>
                <div className="checkoutPage__header">Lieferinformationen</div>
                <div className="checkoutPage__item">
                    <div className="checkoutPage__item-header">[Checkbox] Lieferadresse weicht von persönlicher Adresse ab?</div>
                    <div className="checkoutPage__item-info">
                        If checkbox == true --> All fields of /pages/registration.jsx appear with the default values saved in users table
                        if checkbox == false --> Fields do not appear
                    </div>
                    <div className="checkoutPage__item-header">Versandtart</div>
                    <div className="checkoutPage__item-info">
                        Selection of dfferent versandtart options, e.g. "Standardversand", "Expressversand"
                        (this costs should also be added to the sidebar on te right side)
                        Standard value is "Standatdversand" with 5,90 € as Price
                    </div>
                    <button className="checkoutPage__checkout-button">
                        Weiter zur Kasse
                    </button>
                </div>
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