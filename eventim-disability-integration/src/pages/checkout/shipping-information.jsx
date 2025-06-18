// checkout/shopping-cart.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../config'; // adjust path if needed

export default function Checkout() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [createdAt, setCreatedAt] = useState(null);
    const [timer, setTimer] = useState(0);
    const offsetRef = useRef(0);   // serverTime - localTime

    const [useDifferentAddress, setUseDifferentAddress] = useState(false);
    const [shippingInfo, setShippingInfo] = useState({
        salutation: '',
        firstName: '',
        lastName: '',
        company: '',
        streetAddress: '',
        postalCode: '',
        city: '',
        country: '',
    });

    const shippingOptions = [
        { id: 'standard', label: 'Standardversand', price: 5.9 },
        { id: 'express', label: 'Expressversand', price: 12.9 },
    ];
    const [selectedShipping, setSelectedShipping] = useState(shippingOptions[0]);

    const fetchAddress = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user-address`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.address) setShippingInfo(prev => ({ ...prev, ...data.address }));
            }
        } catch (err) {
            console.error('Error fetching user address:', err);
        }
    };

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
        fetchAddress();
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

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            await fetch(`${API_BASE_URL}/checkout-shipping`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingInfo, shippingMethod: selectedShipping.id })
            });
            router.push('/checkout/payment');
        } catch (err) {
            console.error('Error saving shipping info:', err);
        }
    };

    // guard against undefined
    const subtotal = (items || []).reduce((sum, t) => sum + t.price * t.quantity, 0);
    const shippingCost = selectedShipping.price;
    const total = subtotal + shippingCost;

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
                    <label className="checkoutPage__checkbox">
                        <input
                            type="checkbox"
                            checked={useDifferentAddress}
                            onChange={(e) => setUseDifferentAddress(e.target.checked)}
                        />{' '}
                        Lieferadresse weicht von persönlicher Adresse ab?
                    </label>

                    {useDifferentAddress && (
                        <div className="shipping-form">
                            <div className="checkoutPage__form-field">
                                <label htmlFor="salutation">Anrede</label>
                                <input id="salutation" name="salutation" value={shippingInfo.salutation} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="firstName">Vorname</label>
                                <input id="firstName" name="firstName" value={shippingInfo.firstName} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="lastName">Nachname</label>
                                <input id="lastName" name="lastName" value={shippingInfo.lastName} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="company">Firma</label>
                                <input id="company" name="company" value={shippingInfo.company} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="streetAddress">Straße und Hausnummer</label>
                                <input id="streetAddress" name="streetAddress" value={shippingInfo.streetAddress} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="postalCode">PLZ</label>
                                <input id="postalCode" name="postalCode" value={shippingInfo.postalCode} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="city">Stadt</label>
                                <input id="city" name="city" value={shippingInfo.city} onChange={handleFieldChange} />
                            </div>
                            <div className="checkoutPage__form-field">
                                <label htmlFor="country">Land</label>
                                <input id="country" name="country" value={shippingInfo.country} onChange={handleFieldChange} />
                            </div>
                        </div>
                    )}

                    <div className="checkoutPage__item-header" style={{marginTop: '1rem'}}>Versandtart</div>
                    <div className="checkoutPage__shipping-options">
                        {shippingOptions.map((opt) => (
                            <label key={opt.id} className="shipping-option">
                                <input
                                    type="radio"
                                    name="shippingOption"
                                    value={opt.id}
                                    checked={selectedShipping.id === opt.id}
                                    onChange={() => setSelectedShipping(opt)}
                                />{' '}
                                {opt.label} – € {opt.price.toFixed(2)}
                            </label>
                        ))}
                    </div>
                    <button className="checkoutPage__checkout-button" onClick={handleSubmit}>
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
                    <div className="checkoutPage__order-item">
                        <span>Versand ({selectedShipping.label})</span>
                        <span>€ {shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="checkoutPage__order-subtotal">
                        <span>Gesamt</span>
                        <span>€ {total.toFixed(2)}</span>
                    </div>
                    <small>inkl. MwSt.</small>
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