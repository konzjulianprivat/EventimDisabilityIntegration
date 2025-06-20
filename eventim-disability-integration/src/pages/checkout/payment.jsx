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

    // --- load payment options from DB ---
    const [paymentOptions, setPaymentOptions] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Fetch payment options on mount
    useEffect(() => {
        fetch(`${API_BASE_URL}/payment-options`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then(({ paymentOptions }) => {
                setPaymentOptions(paymentOptions);
                if (paymentOptions.length) {
                    setSelectedPayment(paymentOptions[0]);
                }
            })
            .catch((err) => console.error("Error fetching payment options:", err));
    }, []);

    useEffect(() => {
        if (!paymentOptions.length) return;
        fetch(`${API_BASE_URL}/checkout-payment`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && data.paymentMethod) {
                    const opt = paymentOptions.find((o) => o.id === data.paymentMethod);
                    if (opt) setSelectedPayment(opt);
                }
            })
            .catch((err) => console.error("Error fetching session payment:", err));
    }, [paymentOptions]);

    // --- fetch checkout items + createdAt ---
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

    // --- timer logic ---
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

    // --- compute totals ---
    const subtotal = items.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const shippingCost = 5.9; // adjust as needed
    const total = subtotal + shippingCost;

    // --- submit selected payment ---
    const handleSubmit = async () => {
        if (!selectedPayment) return;
        try {
            await fetch(`${API_BASE_URL}/checkout-payment`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: selectedPayment.id }),
            });

            const res = await fetch(`${API_BASE_URL}/orders`, {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                setTimeout(() => {
                    router.push("/");
                }, 3000);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || "Fehler bei der Bestellung");
            }
        } catch (err) {
            console.error("Error creating order:", err);
        }
    };

    return (
        <div className="checkoutPage">
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
                                    (selectedPayment?.id === opt.id
                                        ? " paymentOption--selected"
                                        : "")
                                }
                                onClick={() => setSelectedPayment(opt)}
                                style={{ margin: "0 10px" }}
                            >
                                <input
                                    type="radio"
                                    name="paymentOption"
                                    value={opt.id}
                                    checked={selectedPayment?.id === opt.id}
                                    onChange={() => setSelectedPayment(opt)}
                                    style={{ display: "none" }}
                                />

                                <div className="paymentOption__content">
                                    <div className="paymentOption__text">
                                        <span className="checkoutPage__text-lg">{opt.label}</span>
                                        <p>{opt.description}</p>
                                    </div>
                                    <img
                                        src={opt.icon_src}
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
                        disabled={!selectedPayment}
                    >
                        Weiter zur Bestellprüfung
                    </button>
                </div>

                {/* === RIGHT SIDEBAR === */}
                <div className="checkoutPage__sidebar">
                    <div className="checkoutPage__reservation-box">
                        Deine Tickets sind noch erhältlich
                        <br />
                        ⏱ Reservierungszeit: {formatTimer(timer)}
                    </div>

                    <div className="checkoutPage__order-summary">
                        <h3>Bestellübersicht</h3>
                        {items
                            .filter((t) => !t.is_assistance_ticket)
                            .map((t) => (
                                <div key={t.id} className="checkoutPage__order-item">
                  <span>
                    {t.quantity} × {t.eventTitle}
                      {items.some(
                          (other) =>
                              other.eventId === t.eventId &&
                              other.category === t.category &&
                              other.is_assistance_ticket
                      ) && (
                          <>
                              <br />{" "}
                              <a style={{ marginLeft: "24px", color: "purple" }}>
                                  + 1 × Begleitung
                              </a>
                          </>
                      )}
                  </span>
                                    <span style={{ textAlign: "end" }}>
                    € {(t.price * t.quantity).toFixed(2)}
                                        {items.some(
                                            (other) =>
                                                other.eventId === t.eventId &&
                                                other.category === t.category &&
                                                other.is_assistance_ticket
                                        ) && (
                                            <>
                                                <br /> <a style={{ color: "purple" }}>€ 0.00</a>
                                            </>
                                        )}
                  </span>
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
                        {paymentOptions.map((opt) => (
                            <img key={opt.id} src={opt.icon_src} alt={opt.label} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}