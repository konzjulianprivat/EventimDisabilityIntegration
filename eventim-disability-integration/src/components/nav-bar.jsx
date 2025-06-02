// components/NavBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function NavBar() {
    const [openDropdown, setOpenDropdown] = useState(null);

    // Holds genres + their subgenres
    const [genres, setGenres] = useState([]);
    // Holds cities + their venues
    const [cities, setCities] = useState([]);

    const eventsRef = useRef(null);
    const placesRef = useRef(null);

    // Fetch genres + subgenres on mount
    useEffect(() => {
        async function fetchGenres() {
            try {
                const res = await fetch('http://localhost:4000/genres-with-subgenres');
                if (!res.ok) throw new Error('Fetch fehlgeschlagen');
                const body = await res.json();
                setGenres(body.genres);
            } catch (err) {
                console.error('Error loading genres:', err);
            }
        }
        fetchGenres();
    }, []);

    // Fetch cities + venues on mount
    useEffect(() => {
        async function fetchCities() {
            try {
                const res = await fetch('http://localhost:4000/cities-with-venues');
                if (!res.ok) throw new Error('Fetch fehlgeschlagen');
                const body = await res.json();
                setCities(body.cities);
            } catch (err) {
                console.error('Error loading cities:', err);
            }
        }
        fetchCities();
    }, []);

    // Close any open dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                eventsRef.current &&
                !eventsRef.current.contains(e.target) &&
                placesRef.current &&
                !placesRef.current.contains(e.target)
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
                    {/* “Alle Events” dropdown (genres + subgenres) */}
                    <div
                        className={`dropdown ${openDropdown === 'events' ? 'show' : ''}`}
                        ref={eventsRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown(prev => (prev === 'events' ? null : 'events'));
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
                                            <a
                                                href={`#/events/genre/${genre.id}/subgenre/${sub.id}`}
                                                className="dropdown-item"
                                                key={sub.id}
                                            >
                                                {sub.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* “Alle Orte” dropdown (cities + venues) */}
                    <div
                        className={`dropdown ${openDropdown === 'places' ? 'show' : ''}`}
                        ref={placesRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown(prev => (prev === 'places' ? null : 'places'));
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
                                            <a
                                                href={`#/events/city/${city.id}/venue/${venue.id}`}
                                                className="dropdown-item"
                                                key={venue.id}
                                            >
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
                    <input
                        type="search"
                        placeholder="Suche nach Künstlern und Events"
                    />
                </div>

                <div className="icons">
                    <Image
                        src="/pictures/language_icon.png"
                        alt="Language"
                        width={24}
                        height={24}
                    />
                    <Image
                        src="/pictures/favourites_icon.png"
                        alt="Favorites"
                        width={24}
                        height={24}
                    />
                    <a href="/login">
                        <Image
                            src="/pictures/profile_icon.png"
                            alt="Profile"
                            width={24}
                            height={24}
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}