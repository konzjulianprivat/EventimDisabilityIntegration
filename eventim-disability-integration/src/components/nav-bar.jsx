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
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const eventsRef = useRef(null);
    const placesRef = useRef(null);
    const profileRef = useRef(null);
    const cartRef = useRef(null);
    const searchRef = useRef(null);

    const { loading: authLoading, loggedIn, user } = useAuth();

    // Load genres
    useEffect(() => {
        fetch(`${API_BASE_URL}/genres-with-subgenres`, { credentials: 'include' })
            .then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((body) => setGenres(body.genres))
            .catch((err) => console.error('Error loading genres:', err));
    }, []);

    // Search tours on input
    useEffect(() => {
        const controller = new AbortController();
        const q = searchQuery.trim();
        if (!q) {
            setSearchResults([]);
            return;
        }
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/search-tours?q=${encodeURIComponent(q)}`,
                    { signal: controller.signal }
                );
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(Array.isArray(data.tours) ? data.tours : []);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Search error:', err);
                    setSearchResults([]);
                }
            }
        }, 300);
        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [searchQuery]);

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
                cartRef.current && !cartRef.current.contains(e.target) &&
                searchRef.current && !searchRef.current.contains(e.target)
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
        <>
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
                                    <a href={`/genres/${g.id}`} className="label" style={{color: 'black'}}>
                                        {g.name}
                                    </a>
                                    <div className="sub-menu">
                                        {g.subgenres.map((s) => (
                                            <a
                                                key={s.id}
                                                href={`/genres/${g.id}/${s.id}`}
                                                className="dropdown-item"
                                                style={{color: 'black'}}
                                            >
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
                                    <a href={`/locations/${c.id}`} className="label" style={{color: 'black'}}>
                                        {c.name}
                                    </a>
                                    <div className="sub-menu">
                                        {c.venues.map((v) => (
                                            <a
                                                key={v.id}
                                                href={`/locations/${c.id}/${v.id}`}
                                                className="dropdown-item"
                                                style={{color: 'black'}}
                                            >
                                                {v.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="search" ref={searchRef}>
                    <input
                        type="search"
                        placeholder="Suche nach Touren"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (!openDropdown) setOpenDropdown('search');
                        }}
                        onFocus={() => setOpenDropdown('search')}
                    />
                    <div className="search-icon">
                        <Image
                            src="/pictures/search_icon.png"
                            alt="Suche"
                            width={20}
                            height={20}
                        />
                    </div>
                    {openDropdown === 'search' && (
                        <div className="nav-search-results">
                            {searchQuery.trim() && searchResults.length === 0 && (
                                <div className="nav-search-no-results">Keine Ergebnisse</div>
                            )}
                            {searchResults.map((tour) => (
                                <div key={tour.id} className="nav-search-item">
                                    <a
                                        href={`/artists/${tour.artist_id}/${tour.id}`}
                                        className="search-tour-title"
                                    >
                                        {tour.title}
                                    </a>
                                    <button className="btn-view-events">Tickets buchen</button>
                                    <div className="nav-search-events">
                                         {(
                                           // build a Map keyed by event.id → last-seen event, then grab unique events
                                               [...new Map(tour.events.map(ev => [ev.id, ev])).values()]
                                         ).map(ev => {
                                            const dt = new Date(ev.start_time);
                                            const ds = dt.toLocaleDateString('de-DE');
                                            const ts = dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <a
                                                    key={ev.id}
                                                    href={`/artists/${tour.artist_id}/${tour.id}/${ev.id}`}
                                                    className="nav-search-event-link"
                                                >
                                                    {ds} {ts} – {ev.cityName}, {ev.venueName}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                            <div key={item.id} className={`cart-row ${item.is_assistance_ticket ? 'assistance' : ''}`}>
                                                <div className="cart-info">
                                                    <span className="cart-title">{item.title}</span>
                                                    <span className="cart-subtitle">{item.category}</span>
                                                </div>
                                                <div className="cart-qty">{item.quantity}</div>
                                                <div className="cart-qty">
                                                    {item.is_assistance_ticket && <span className="assist-flag">B</span>}
                                                </div>
                                                <div className="cart-line-price">
                                                    {(item.quantity * parseFloat(item.price)).toFixed(2)} €
                                                </div>
                                                <button
                                                    className="cart-delete-btn"
                                                    onClick={() => deleteCartItem(item.id)}
                                                    disabled={item.is_assistance_ticket}
                                                    aria-label="Entfernen"
                                                    style={{color: item.is_assistance_ticket ? 'lightgray' : undefined}}
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
                                                        window.location.href = '/checkout/shopping-cart';
                                                    } else if (res.status === 409) {
                                                        setShowCheckoutModal(true);
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
                                        <p style={{fontSize: "0.75rem", color: "grey"}}>{user.visibleUserId ? ` User-ID: ${user.visibleUserId}` : ''}</p>
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
        {showCheckoutModal && (
            <div className="checkout-modal-overlay">
                <div className="checkout-modal">
                    <p>Sie haben bereits einen laufenden Checkout.</p>
                    <div className="checkout-modal-actions">
                        <button
                            className="btn-ok"
                            onClick={() => setShowCheckoutModal(false)}
                        >
                            Okay
                        </button>
                        <button
                            className="btn-end"
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_BASE_URL}/checkout`, {
                                        method: 'DELETE',
                                        credentials: 'include',
                                    });
                                    if (res.ok) {
                                        setShowCheckoutModal(false);
                                    } else {
                                        alert('Fehler beim Beenden des Checkouts.');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    alert('Netzwerkfehler beim Beenden des Checkouts.');
                                }
                            }}
                        >
                            Checkout beenden
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}