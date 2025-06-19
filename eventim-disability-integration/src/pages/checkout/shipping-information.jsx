// checkout/shopping-cart.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../config';

export default function Checkout() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [createdAt, setCreatedAt] = useState(null);
    const [timer, setTimer] = useState(0);
    const offsetRef = useRef(0);

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

    const fetchCheckout = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/checkout-items`, { credentials: 'include' });
            if (res.status === 404) {
                window.location.href = '/';
                return;
            }
            const { createdAt: serverCreatedAt, items: fetchedItems } = await res.json();
            setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
            const localNow = Date.now();
            const serverNow = localNow;
            offsetRef.current = serverNow - localNow;
            setCreatedAt(new Date(serverCreatedAt).getTime());
        } catch (err) {
            console.error('Error fetching checkout:', err);
        }
    };

    useEffect(() => {
        fetchCheckout();
        fetchAddress();
        const poll = setInterval(fetchCheckout, 15_000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        if (!createdAt) return;
        const iv = setInterval(() => {
            const now = Date.now() + offsetRef.current;
            const elapsed = Math.floor((now - createdAt) / 1000);
            const remaining = 15 * 60 - elapsed;
            if (remaining <= 0) {
                clearInterval(iv);
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

    const subtotal = (items || []).reduce((sum, t) => sum + t.price * t.quantity, 0);
    const shippingCost = selectedShipping.price;
    const total = subtotal + shippingCost;

    return (
        <div className="checkoutPage__container">
            <div className="checkoutPage__item" style={{ paddingLeft: '15px', minWidth: '350px' }}>
                <div className="checkoutPage__header">Lieferinformationen</div>

                <label className="checkoutPage__styled-checkbox">
                    <input
                        type="checkbox"
                        checked={useDifferentAddress}
                        onChange={(e) => setUseDifferentAddress(e.target.checked)}
                    />
                    <span className="checkbox-label">Lieferadresse weicht von persönlicher Adresse ab?</span>
                </label>

                {useDifferentAddress && (
                    <div className="shipping-form">
                        {['salutation', 'firstName', 'lastName', 'company', 'streetAddress', 'postalCode', 'city', 'country'].map(field => (
                            <div key={field} className="checkoutPage__form-field">
                                <label htmlFor={field}>{{
                                    salutation: 'Anrede',
                                    firstName: 'Vorname',
                                    lastName: 'Nachname',
                                    company: 'Firma',
                                    streetAddress: 'Straße und Hausnummer',
                                    postalCode: 'PLZ',
                                    city: 'Stadt',
                                    country: 'Land'
                                }[field]}</label>
                                <input id={field} name={field} value={shippingInfo[field]} onChange={handleFieldChange} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="checkoutPage__item-header" style={{ marginTop: '1rem' }}>Versandart</div>
                <div className="checkoutPage__shipping-options styled-radio-group">
                    {shippingOptions.map((opt) => (
                        <label key={opt.id} className="styled-radio-option">
                            <input
                                type="radio"
                                name="shippingOption"
                                value={opt.id}
                                checked={selectedShipping.id === opt.id}
                                onChange={() => setSelectedShipping(opt)}
                            />
                            <span>{opt.label} – € {opt.price.toFixed(2)}</span>
                        </label>
                    ))}
                </div>

                <button className="checkoutPage__checkout-button" onClick={handleSubmit}>
                    Weiter zur Kasse
                </button>
            </div>

            <div className="checkoutPage__sidebar">
                <div className="checkoutPage__reservation-box">
                    Deine Tickets sind noch erhältlich<br />
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