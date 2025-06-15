// components/NavBar.jsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';

export default function NavBar() {
    const [openDropdown, setOpenDropdown] = useState(null);

    const [genres, setGenres] = useState([]);
    const [cities, setCities] = useState([]);

    const eventsRef = useRef(null);
    const placesRef = useRef(null);
    const profileRef = useRef(null);
    const cartRef = useRef(null);

    const { loading, loggedIn, user } = useAuth();

    const [cartItems] = useState([
        { id: 1, title: 'Rock Legends Tour', category: 'VIP', quantity: 2, price: 120.00 },
        { id: 2, title: 'Acoustic Evenings', category: 'Standard', quantity: 3, price: 45.50 },
        { id: 3, title: 'Electronic Fest', category: 'Early Bird', quantity: 1, price: 75.00 },
    ]);
    const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = cartItems
        .reduce((sum, i) => sum + i.quantity * i.price, 0)
        .toFixed(2);

    useEffect(() => {
        async function fetchGenres() {
            try {
                const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Fetch fehlgeschlagen');
                const body = await res.json();
                setGenres(body.genres);
            } catch (err) {
                console.error('Error loading genres:', err);
            }
        }
        fetchGenres();
    }, []);

    useEffect(() => {
        async function fetchCities() {
            try {
                const res = await fetch(`${API_BASE_URL}/cities-with-venues`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Fetch fehlgeschlagen');
                const body = await res.json();
                setCities(body.cities);
            } catch (err) {
                console.error('Error loading cities:', err);
            }
        }
        fetchCities();
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                eventsRef.current &&
                !eventsRef.current.contains(e.target) &&
                placesRef.current &&
                !placesRef.current.contains(e.target) &&
                profileRef.current &&
                !profileRef.current.contains(e.target)
            ) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
                                setOpenDropdown((prev) => (prev === 'events' ? null : 'events'));
                            }}
                        >
                            Alle Events
                        </a>
                        <div className="dropdown-menu">
                            {genres.map((genre) => (
                                <div className="dropdown-item" key={genre.id}>
                                    <span className="label">{genre.name}</span>
                                    <div className="sub-menu">
                                        {genre.subgenres.map((sub) => (
                                            <a href="" className="dropdown-item" key={sub.id}>
                                                {sub.name}
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
                                setOpenDropdown((prev) => (prev === 'places' ? null : 'places'));
                            }}
                        >
                            Alle Orte
                        </a>
                        <div className="dropdown-menu">
                            {cities.map((city) => (
                                <div className="dropdown-item" key={city.id}>
                                    <span className="label">{city.name}</span>
                                    <div className="sub-menu">
                                        {city.venues.map((venue) => (
                                            <a href="" className="dropdown-item" key={venue.id}>
                                                {venue.name}
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
                    {/* CART DROPDOWN */}
                    <div
                        className={`dropdown cart ${openDropdown === 'cart' ? 'show' : ''}`}
                        ref={cartRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle cart-icon"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown(prev => (prev === 'cart' ? null : 'cart'));
                            }}
                        >
                            <Image
                                src="/pictures/cart_icon.png"
                                alt="Warenkorb"
                                width={24}
                                height={24}
                            />
                        </a>
                        <div className="dropdown-menu cart-menu">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-row">
                                    <div className="cart-info">
                                        <span className="cart-title">{item.title}</span>
                                        <span className="cart-subtitle">{item.category}</span>
                                    </div>
                                    <div className="cart-qty">{item.quantity}</div>
                                    <div className="cart-line-price">
                                        {(item.quantity * item.price).toFixed(2)} €
                                    </div>
                                </div>
                            ))}

                            <div className="dropdown-divider" />

                            <div className="cart-summary">
                    <span>
                      Gesamt ({totalQuantity} Tickets):
                    </span>
                                <strong>
                                    {totalPrice} €
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="login-button dropdown-logout"
                                onClick={() => { /* handle continue */ }}
                            >
                                Weiter
                            </button>
                        </div>
                    </div>
                    {loading ? null : loggedIn ? (
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
                                    setOpenDropdown((prev) =>
                                        prev === 'profile' ? null : 'profile'
                                    );
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
                                <a href="" className="dropdown-item">
                                    Persönliche Daten
                                </a>
                                <a href="" className="dropdown-item">
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
                                        try {
                                            const current =
                                                window.location.pathname +
                                                window.location.search;
                                            await fetch(`${API_BASE_URL}/logout`, {
                                                method: 'POST',
                                                credentials: 'include',
                                            });
                                            localStorage.removeItem('user');
                                            window.location.href = current || '/';
                                        } catch (err) {
                                            console.error('Logout fehlgeschlagen:', err);
                                        }
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
                                const current = window.location.pathname + window.location.search;
                                const redirect = current !== '/' ? `?redirect=${encodeURIComponent(current)}` : '';
                                window.location.href = `/login${redirect}`;
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