// ── components/nav-bar.jsx ──
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { API_BASE_URL } from '../config';

export default function NavBar() {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [genres, setGenres] = useState([]);
    const [cities, setCities] = useState([]);
    const { items: cartItems, loading: cartLoading, reload: reloadCart } = useCart();

    const eventsRef = useRef(null);
    const placesRef = useRef(null);
    const profileRef = useRef(null);
    const cartRef = useRef(null);

    const { loading: authLoading, loggedIn, user } = useAuth();

    // Load genres
    useEffect(() => {
        fetch(`${API_BASE_URL}/genres-with-subgenres`, { credentials: 'include' })
            .then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((body) => setGenres(body.genres))
            .catch((err) => console.error('Error loading genres:', err));
    }, []);

    // Load cities
    useEffect(() => {
        fetch(`${API_BASE_URL}/cities-with-venues`, { credentials: 'include' })
            .then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((body) => setCities(body.cities))
            .catch((err) => console.error('Error loading cities:', err));
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                eventsRef.current && !eventsRef.current.contains(e.target) &&
                placesRef.current && !placesRef.current.contains(e.target) &&
                profileRef.current && !profileRef.current.contains(e.target) &&
                cartRef.current && !cartRef.current.contains(e.target)
            ) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = cartItems
        .reduce((sum, i) => sum + i.quantity * parseFloat(i.price), 0)
        .toFixed(2);

    // Delete one cart-item and then reload
    const deleteCartItem = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Delete failed');
            reloadCart();
        } catch (err) {
            console.error('Error deleting cart item:', err);
        }
    };

    return (
        <div className="nav-bar">
            <div className="nav-wrapper">
                <div className="logo">
                    <a href="/">
                        <Image
                            src="/pictures/eventim_logo.svg"
                            alt="Eventim Logo"
                            width={120}
                            height={40}
                        />
                    </a>
                </div>

                <nav className="menu">
                    <div
                        className={`dropdown ${openDropdown === 'events' ? 'show' : ''}`}
                        ref={eventsRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown((o) => (o === 'events' ? null : 'events'));
                            }}
                        >
                            Alle Events
                        </a>
                        <div className="dropdown-menu">
                            {genres.map((g) => (
                                <div key={g.id} className="dropdown-item">
                                    <span className="label">{g.name}</span>
                                    <div className="sub-menu">
                                        {g.subgenres.map((s) => (
                                            <a key={s.id} href="#" className="dropdown-item">
                                                {s.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className={`dropdown ${openDropdown === 'places' ? 'show' : ''}`}
                        ref={placesRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown((o) => (o === 'places' ? null : 'places'));
                            }}
                        >
                            Alle Orte
                        </a>
                        <div className="dropdown-menu">
                            {cities.map((c) => (
                                <div key={c.id} className="dropdown-item">
                                    <span className="label">{c.name}</span>
                                    <div className="sub-menu">
                                        {c.venues.map((v) => (
                                            <a key={v.id} href="#" className="dropdown-item">
                                                {v.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="search">
                    <input type="search" placeholder="Suche nach Künstlern und Events" />
                </div>

                <div className="icons">
                    {!authLoading && loggedIn && (
                        <div
                            className={`dropdown cart ${openDropdown === 'cart' ? 'show' : ''}`}
                            ref={cartRef}
                        >
                            <a
                                href="#"
                                className="dropdown-toggle cart-icon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setOpenDropdown((o) => (o === 'cart' ? null : 'cart'));
                                }}
                            >
                                <Image
                                    src="/pictures/cart_icon.png"
                                    alt="Warenkorb"
                                    width={24}
                                    height={24}
                                />
                                {totalQuantity > 0 && (
                                    <span className="badge">{totalQuantity}</span>
                                )}
                            </a>

                            <div className="dropdown-menu cart-menu">
                                {cartLoading ? (
                                    <div className="cart-loading">Lade...</div>
                                ) : cartItems.length === 0 ? (
                                    <div className="cart-empty-panel">
                                        <h4>Ihr Warenkorb ist noch leer!</h4>
                                        <p>Entdecke jetzt spannende Events und sichere dir dein Ticket.</p>
                                        <a href="/events" className="btn-discover">
                                            Events entdecken
                                        </a>
                                    </div>
                                ) : (
                                    <>
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="cart-row">
                                                <div className="cart-info">
                                                    <span className="cart-title">{item.title}</span>
                                                    <span className="cart-subtitle">{item.category}</span>
                                                </div>
                                                <div className="cart-qty">{item.quantity}</div>
                                                <div className="cart-line-price">
                                                    {(item.quantity * parseFloat(item.price)).toFixed(2)} €
                                                </div>
                                                <button
                                                    className="cart-delete-btn"
                                                    onClick={() => deleteCartItem(item.id)}
                                                    aria-label="Entfernen"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        <div className="dropdown-divider" />
                                        <div className="cart-summary">
                                            <span>Gesamt ({totalQuantity} Tickets):</span>
                                            <strong>{totalPrice} €</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="login-button dropdown-logout"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${API_BASE_URL}/checkout`, {
                                                        method: 'POST',
                                                        credentials: 'include',
                                                    });
                                                    if (res.ok) {
                                                        // success! send them on to the checkout page
                                                        window.location.href = '/checkout';
                                                    } else if (res.status === 409) {
                                                        alert('Sie haben bereits einen offenen Checkout.');
                                                    } else {
                                                        alert('Fehler beim Erstellen des Checkouts.');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Netzwerkfehler beim Checkout.');
                                                }
                                            }}
                                        >
                                            Weiter
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {authLoading ? null : loggedIn ? (
                        <div
                            className={`dropdown profile ${
                                openDropdown === 'profile' ? 'show' : ''
                            }`}
                            ref={profileRef}
                        >
                            <a
                                href="#"
                                className="dropdown-toggle"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setOpenDropdown((o) => (o === 'profile' ? null : 'profile'));
                                }}
                            >
                                <Image
                                    src="/pictures/profile_icon.png"
                                    alt="Profile"
                                    width={24}
                                    height={24}
                                />
                            </a>
                            <div className="dropdown-menu">
                                <a href="/profile" className="dropdown-item">
                                    Übersicht
                                </a>
                                <a href="#" className="dropdown-item">
                                    Persönliche Daten
                                </a>
                                <a href="#" className="dropdown-item">
                                    Meine Bestellungen
                                </a>

                                <div className="dropdown-divider" />

                                <div className="dropdown-footer">
                                    <div className="dropdown-footer-name">
                                        <p>Angemeldet als</p>
                                        <h3>
                                            {user.firstName} {user.lastName}
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="login-button dropdown-logout"
                                    onClick={async () => {
                                        await fetch(`${API_BASE_URL}/logout`, {
                                            method: 'POST',
                                            credentials: 'include',
                                        });
                                        localStorage.removeItem('user');
                                        window.location.reload();
                                    }}
                                >
                                    Abmelden
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="login-button"
                            onClick={() => {
                                const returnTo = window.location.pathname + window.location.search
                                window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`
                            }}
                        >
                            Anmelden
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}