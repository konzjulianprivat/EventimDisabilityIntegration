// components/NavBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const eventsMenu = [
    {
        label: 'Konzerte',
        items: [
            'Übersicht Konzerte',
            'Rock & Pop (10380)',
            'HipHop & R’n’B (1608)',
            'Schlager & Volksmusik (1707)',
            'Hard & Heavy (2576)',
            'Clubkonzerte (1128)',
            'Festivals (2025)',
            'Electronic & Dance (538)',
            'Jazz & Blues (1238)',
            'Country & Folk (377)',
            'Weitere Konzerte (7862)',
        ],
    },
    {
        label: 'Kultur',
        items: [
            'Ausstellungen (234)',
            'Lesungen (98)',
            'Theater (317)',
            'Oper & Ballett (156)',
            'Film (485)',
        ],
    },
    {
        label: 'Musical & Show',
        items: ['Musicals (412)', 'Shows & Varieté (254)'],
    },
    {
        label: 'Humor',
        items: ['Stand-up (198)', 'Kabarett (122)'],
    },
    {
        label: 'Sport',
        items: ['Fußball (512)', 'Basketball (76)', 'Tennis (44)'],
    },
    {
        label: 'Freizeit',
        items: ['Messen (87)', 'Parks & Freizeit (63)'],
    },
    {
        label: 'VIP & Extras',
        items: ['VIP-Packages (39)', 'Backstage-Tour (12)'],
    },
];

const placesMenu = [
    { label: 'Deutschland', items: ['Berlin', 'München', 'Hamburg'] },
    { label: 'Österreich', items: ['Wien', 'Salzburg', 'Graz'] },
    { label: 'Schweiz', items: ['Zürich', 'Basel', 'Genf'] },
];

export default function NavBar() {
    const [openDropdown, setOpenDropdown] = useState(null);
    const eventsRef = useRef(null);
    const placesRef = useRef(null);

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
                    <div
                        className={`dropdown ${
                            openDropdown === 'events' ? 'show' : ''
                        }`}
                        ref={eventsRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown(
                                    openDropdown === 'events'
                                        ? null
                                        : 'events'
                                );
                            }}
                        >
                            Alle Events
                        </a>
                        <div className="dropdown-menu">
                            {eventsMenu.map((cat) => (
                                <div
                                    className="dropdown-item"
                                    key={cat.label}
                                >
                                    <span className="label">
                                        {cat.label}
                                    </span>
                                    <div className="sub-menu">
                                        {cat.items.map((item) => (
                                            <a
                                                href="#"
                                                className="dropdown-item"
                                                key={item}
                                            >
                                                {item}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className={`dropdown ${
                            openDropdown === 'places' ? 'show' : ''
                        }`}
                        ref={placesRef}
                    >
                        <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdown(
                                    openDropdown === 'places'
                                        ? null
                                        : 'places'
                                );
                            }}
                        >
                            Alle Orte
                        </a>
                        <div className="dropdown-menu">
                            {placesMenu.map((region) => (
                                <div
                                    className="dropdown-item"
                                    key={region.label}
                                >
                                    <span className="label">
                                        {region.label}
                                    </span>
                                    <div className="sub-menu">
                                        {region.items.map((city) => (
                                            <a
                                                href="#"
                                                className="dropdown-item"
                                                key={city}
                                            >
                                                {city}
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