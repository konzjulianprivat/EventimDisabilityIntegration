// pages/checkout/payment.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { API_BASE_URL } from "../../config";

export default function Payment() {
    const router = useRouter();

    // --- checkout + timer state (same as shipping) ---
    const [items, setItems] = useState([]);
    const [createdAt, setCreatedAt] = useState(null);
    const [timer, setTimer] = useState(0);
    const offsetRef = useRef(0);

    const fetchCheckout = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/checkout-items`, {
                credentials: "include",
            });
            if (res.status === 404) {
                window.location.href = "/";
                return;
            }
            const { createdAt: serverCreatedAt, items: fetchedItems } =
                await res.json();
            setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
            offsetRef.current = 0;
            setCreatedAt(new Date(serverCreatedAt).getTime());
        } catch (err) {
            console.error("Error fetching checkout:", err);
        }
    };

    useEffect(() => {
        fetchCheckout();
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
                    method: "DELETE",
                    credentials: "include",
                }).finally(() => {
                    alert("Deine Reservierungszeit ist abgelaufen.");
                    window.location.href = "/";
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

    // --- static payment options from your screenshot ---
    const paymentOptions = [
        {
            id: "sepa",
            label: "Bankeinzug",
            description: "Mit Chance auf einen von drei 100€-Gutscheinen!",
            icon: "/pictures/payment-methods/sepa.svg",
        },
        {
            id: "sofort",
            label: "Apple Pay / Google Pay",
            description: "Einfach mit Apple Pay oder Google Pay bezahlen",
            icon: "/pictures/payment-methods/gpay_apay.svg",
        },
        {
            id: "card",
            label: "Karte",
            description:
                "Einfach Bank auswählen, einloggen und Zahlung bestätigen",
            icon: "/pictures/payment-methods/visa_master_amex.svg",
        },
        {
            id: "klarna",
            label: "Bezah­le mit Klarna",
            description:
                "Sofort, in bis zu 30 Tagen bezahlen oder teile die Kosten auf",
            icon: "/pictures/payment-methods/klarna.svg",
        },
        {
            id: "paypal",
            label: "PayPal",
            description: "Einfach, schnell und sicher mit PayPal bezahlen.",
            icon: "/pictures/payment-methods/paypal.svg",
        },
    ];

    const [selectedPayment, setSelectedPayment] = useState(paymentOptions[0]);

    // --- compute totals ---
    const subtotal = items.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const shippingCost = 5.9; // adjust as needed
    const total = subtotal + shippingCost;

    // --- submit selected payment ---
    const handleSubmit = async () => {
        try {
            await fetch(`${API_BASE_URL}/checkout-payment`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: selectedPayment.id }),
            });
            router.push("/checkout/review");
        } catch (err) {
            console.error("Error saving payment method:", err);
        }
    };

    return (
        <div className="checkoutPage__container">
            {/* === LEFT PANEL === */}
            <div
                className="checkoutPage__item"
                style={{ paddingLeft: "15px", minWidth: "350px" }}
            >
                <div className="checkoutPage__header">Zahlungsart auswählen</div>

                <div className="styled-radio-group">
                    {paymentOptions.map((opt) => (
                        <div
                            key={opt.id}
                            className={
                                "paymentOption" +
                                (selectedPayment.id === opt.id
                                    ? " paymentOption--selected"
                                    : "")
                            }
                            onClick={() => setSelectedPayment(opt)}
                            style={{marginLeft: "10px", marginRight: "10px"}}
                        >
                            {/* keep the input for form semantics, but hide it */}
                            <input
                                type="radio"
                                name="paymentOption"
                                value={opt.id}
                                checked={selectedPayment.id === opt.id}
                                onChange={() => setSelectedPayment(opt)}
                                style={{ display: "none" }}
                            />

                            <div className="paymentOption__content">
                                <div className="paymentOption__text">
                                    <span className="checkoutPage__text-lg">{opt.label}</span>
                                    <p>{opt.description}</p>
                                </div>
                                <img
                                    src={opt.icon}
                                    alt={opt.label}
                                    className="paymentOption__icon"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* summary inside main panel */}
                <div
                    className="paymentSummary__lines"
                    style={{ marginTop: "30px", padding: "10px" }}
                >
                    <div className="checkoutPage__order-item">
                        <span>Versandkosten</span>
                        <span>€ {shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="checkoutPage__order-subtotal">
                        <span>Gesamtsumme</span>
                        <span>€ {total.toFixed(2)}</span>
                    </div>
                    <small>inkl. MwSt.</small>
                </div>

                <button
                    className="checkoutPage__checkout-button checkoutPage__text-lg"
                    onClick={handleSubmit}
                >
                    Weiter zur Bestellprüfung
                </button>
            </div>

            {/* === RIGHT SIDEBAR (unchanged) === */}
            <div className="checkoutPage__sidebar">
                <div className="checkoutPage__reservation-box">
                    Deine Tickets sind noch erhältlich
                    <br />
                    ⏱ Reservierungszeit: {formatTimer(timer)}
                </div>

                <div className="checkoutPage__order-summary">
                    <h3>Bestellübersicht</h3>
                    {items.map((t) => (
                        <div key={t.id} className="checkoutPage__order-item">
              <span>
                {t.quantity} × {t.eventTitle}
              </span>
                            <span>€ {(t.price * t.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="checkoutPage__order-item">
                        <span>Versand (–)</span>
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
                    <img
                        src="/pictures/payment-methods/visa_master_amex.svg"
                        alt="VISA"
                    />
                    <img src="/pictures/payment-methods/paypal.svg" alt="PayPal" />
                    <img
                        src="/pictures/payment-methods/gpay_apay.svg"
                        alt="Google & Apple Pay"
                    />
                    <img src="/pictures/payment-methods/klarna.svg" alt="Klarna" />
                </div>
            </div>
        </div>
    );
}