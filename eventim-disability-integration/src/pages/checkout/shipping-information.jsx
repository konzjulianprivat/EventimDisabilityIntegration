// checkout/shipping-information.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../config';

export default function ShippingInformation() {
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

    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShipping, setSelectedShipping] = useState(null);


    // Fetch user data
    const fetchAddress = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user-address`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.address) {
                    const addr = data.address;
                    const mapped = {
                        salutation:   addr.salutation || '',
                        firstName:    addr.first_name || '',
                        lastName:     addr.last_name || '',
                        company:      addr.company || '',
                        streetAddress: addr.street_address || '',
                        postalCode:   addr.postal_code || '',
                        city:         addr.city || '',
                        country:      addr.country || '',
                    };
                    setShippingInfo(prev => ({ ...prev, ...mapped }));
                }
            }
        } catch (err) {
            console.error('Error fetching user address:', err);
        }
    };

    const fetchShippingOptions = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/shipping-options`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const opts = Array.isArray(data.options) ? data.options : [];
                setShippingOptions(opts);
                if (opts.length && !selectedShipping) {
                    setSelectedShipping(opts[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching shipping options:', err);
        }
    };

    const fetchSessionShipping = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/checkout-shipping`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.shippingInfo) {
                    const { shippingInfo: info, shippingMethod } = data.shippingInfo;
                    if (info) setShippingInfo(prev => ({ ...prev, ...info }));
                    if (shippingMethod && shippingOptions.length) {
                        const opt = shippingOptions.find(o => o.id === shippingMethod);
                        if (opt) setSelectedShipping(opt);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching session shipping info:', err);
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
            const now = Date.now();
            offsetRef.current = now - now;
            setCreatedAt(new Date(serverCreatedAt).getTime());
        } catch (err) {
            console.error('Error fetching checkout:', err);
        }
    };

    useEffect(() => {
        fetchCheckout();
        fetchAddress();
        fetchShippingOptions();
        const poll = setInterval(fetchCheckout, 15_000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        if (shippingOptions.length) {
            fetchSessionShipping();
        }
    }, [shippingOptions]);

    useEffect(() => {
        if (useDifferentAddress) {
            fetchAddress();
        }
    }, [useDifferentAddress]);

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

    const formatTimer = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60 < 10 ? `0${s % 60}` : s % 60;
        return `${m}:${sec} Min.`;
    };

    const handleFieldChange = e => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            await fetch(`${API_BASE_URL}/checkout-shipping`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingInfo, shippingMethod: selectedShipping ? selectedShipping.id : null })
            });
            router.push('/checkout/payment');
        } catch (err) {
            console.error('Error saving shipping info:', err);
        }
    };

    const subtotal = items.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const shippingCost = selectedShipping ? selectedShipping.price : 0;
    const total = Number(subtotal) + Number(shippingCost);

    return (
        <div className="checkoutPage">
        <div className="checkoutPage__container">
            <div className="checkoutPage__item" style={{ paddingLeft: '15px', minWidth: '350px' }}>
                <div className="checkoutPage__header">Lieferinformationen</div>

                <div className="checkoutPage__item">
                    <div className="checkoutPage__item-header" style={{ marginTop: '1rem' }}>
                        <h3>Lieferadresse</h3>
                    </div>
                    <label className="checkoutPage__styled-checkbox">
                        <input
                            type="checkbox"
                            checked={useDifferentAddress}
                            onChange={e => setUseDifferentAddress(e.target.checked)}
                        />
                        <span className="checkoutPage__checkbox-label checkoutPage__text-lg">
                            Lieferadresse weicht von persönlicher Adresse ab?
                        </span>
                    </label>

                    {useDifferentAddress && (
                        <div className="shipping-form">
                            <div className="checkoutPage__form-field">
                                <label htmlFor="salutation">Anrede</label>
                                <select
                                    id="salutation"
                                    name="salutation"
                                    value={shippingInfo.salutation || ''}
                                    onChange={handleFieldChange}
                                >
                                    <option value="">Bitte wählen</option>
                                    <option value="Herr">Herr</option>
                                    <option value="Frau">Frau</option>
                                    <option value="Dr.">Dr.</option>
                                    <option value="Prof.">Prof.</option>
                                    <option value="Divers">Divers</option>
                                </select>
                            </div>

                            {['firstName', 'lastName', 'company', 'streetAddress'].map((field) => (
                                <div key={field} className="checkoutPage__form-field">
                                    <label htmlFor={field}>{{
                                        firstName: 'Vorname',
                                        lastName: 'Nachname',
                                        company: 'Firma',
                                        streetAddress: 'Straße und Hausnummer'
                                    }[field]}</label>
                                    <input
                                        id={field}
                                        name={field}
                                        value={shippingInfo[field]}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div style={{ flex: '1' }} className="checkoutPage__form-field">
                                    <label htmlFor="postalCode">PLZ</label>
                                    <input
                                        id="postalCode"
                                        name="postalCode"
                                        value={shippingInfo.postalCode}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                                <div style={{ flex: '2' }} className="checkoutPage__form-field">
                                    <label htmlFor="city">Stadt</label>
                                    <input
                                        id="city"
                                        name="city"
                                        value={shippingInfo.city}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                            </div>

                            <div className="checkoutPage__form-field">
                                <label htmlFor="country">Land</label>
                                <input
                                    id="country"
                                    name="country"
                                    value={shippingInfo.country}
                                    onChange={handleFieldChange}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="checkoutPage__item">
                    <div className="checkoutPage__item-header" style={{ marginTop: '1rem' }}>
                        <h3>Versandart</h3>
                    </div>
                    <div className="checkoutPage__shipping-options styled-radio-group">
                        {shippingOptions.map(opt => (
                            <label key={opt.id} className="styled-radio-option">
                                <input
                                    type="radio"
                                    name="shippingOption"
                                    value={opt.id}
                                    checked={selectedShipping && selectedShipping.id === opt.id}
                                    onChange={() => setSelectedShipping(opt)}
                                />
                                <span className="checkoutPage__shipping-option-label checkoutPage__text-lg">
                                    {opt.label} – € {Number(opt.price).toFixed(2)}
                                    <p>{opt.description}</p>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    className="checkoutPage__checkout-button checkoutPage__text-lg"
                    onClick={handleSubmit}
                >
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
                    {items
                        .filter(t => !t.is_assistance_ticket)
                        .map(t => (
                            <div key={t.id} className="checkoutPage__order-item">
                            <span>
                                {t.quantity} × {t.eventTitle}
                                {
                                    items.some(other =>
                                        other.eventId === t.eventId &&
                                        other.category === t.category &&
                                        other.is_assistance_ticket
                                    ) && (
                                        <>
                                            <br/> <a style={{marginLeft: "24px", color: "purple"}}>+ 1 × Begleitung</a>
                                        </>
                                    )
                                }
                            </span>
                                <span style={{textAlign: "end"}}>
                                € {(t.price * t.quantity).toFixed(2)}
                                    {
                                        items.some(other =>
                                            other.eventId === t.eventId &&
                                            other.category === t.category &&
                                            other.is_assistance_ticket
                                        ) && (
                                            <>
                                                <br/> <a style={{color: "purple"}}>€ 0.00</a>
                                            </>
                                        )
                                    }
                            </span>
                            </div>
                        ))}
                    {selectedShipping && (
                      <div className="checkoutPage__order-item">
                            <span>Versand ({selectedShipping.label})</span>
                          <span>€ {Number(shippingCost).toFixed(2)}</span>
                          </div>
                    )}
                    <div className="checkoutPage__order-subtotal">
                        <span>Gesamt</span>
                        <span>€ {Number(total).toFixed(2)}</span>
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
        </div>
    );
}