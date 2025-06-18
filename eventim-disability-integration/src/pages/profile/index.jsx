// pages/profile/shopping-cart.jsx
"use client";

import React, { useState } from "react";
import SquareTourCard from "../../components/squareTourCard";

/**
 * Beispiel‐Datensatz: 8 Einträge
 */
const sampleTourData = [
    {
        imageId: "90bbc401-2984-494b-a34c-59831427a0b3",
        title: "Rod Stewart",
        priceText: "Tickets ab € 68,00",
        link: "#",
    },
    {
        imageId: "f1d49502-0d05-4ea8-b347-2b22cac9ea65",
        title: "Tom Odell",
        priceText: "Tickets ab € 60,40",
        link: "#",
    },
    {
        imageId: "d3b82c8c-4c08-4859-88a2-ca4cfebc08df",
        title: "Disney In Concert",
        priceText: "Tickets ab € 59,90",
        link: "#",
    },
    {
        imageId: "82a3438f-83a4-475a-90a3-fc9fe951faac",
        title: "Schwanensee – Ballett",
        priceText: "Tickets ab € 42,00",
        link: "#",
    },
    {
        imageId: "5da11a45-7366-42dc-8604-e81851271b25",
        title: "Ehrlich Brothers",
        priceText: "Tickets ab € 52,00",
        link: "#",
    },
    {
        imageId: "1dd71154-1920-4c77-99f1-94e08572eb78",
        title: "Tom Gaebel",
        priceText: "Tickets ab € 39,90",
        link: "#",
    },
    {
        imageId: "68368c8c-2094-463a-8698-adea0440b44c",
        title: "Teddy Teclebrhan",
        priceText: "Tickets ab € 42,25",
        link: "#",
    },
    {
        imageId: "9fde1a84-3a64-4a0a-9210-7c9bb3dcb7e5",
        title: "Lars Eidinger",
        priceText: "Tickets ab € 35,00",
        link: "#",
    },
];

export default function ProfilePage() {
    // Sidebar‐Zustand
    const [activeSidebarItem, setActiveSidebarItem] = useState("Meine Events");

    // Karussell‐Index (Start = 0)
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Anzahl der Karten, die gleichzeitig nebeneinander im Karussell angezeigt werden
    const VISIBLE_COUNT = 5;

    // Beispielkarten für den blauen Platzhalter-Bereich
    // Wenn dieses Array leer ist, zeigen wir nur den Hinweistext.
    // Sobald hier >=1 Karten drin sind, verschwindet der Text und die Karten werden gerendert.
    const blueCards = [sampleTourData[0], sampleTourData[1]];

    // Linker/Rechter Button-Handler (jeweils um 1 Karte verschieben)
    const handlePrev = () => {
        if (carouselIndex > 0) {
            setCarouselIndex(carouselIndex - 1);
        }
    };
    const handleNext = () => {
        if (carouselIndex < sampleTourData.length - VISIBLE_COUNT) {
            setCarouselIndex(carouselIndex + 1);
        }
    };

    // Slice: 5 Karten ab carouselIndex
    const visibleSlice = sampleTourData.slice(
        carouselIndex,
        carouselIndex + VISIBLE_COUNT
    );

    return (
        <div className="profile-container">
            {/* ================= Sidebar ================= */}
            <aside className="sidebar">
                <div
                    className={`sidebar-item ${
                        activeSidebarItem === "Mein EVENTIM" ? "active" : ""
                    }`}
                    onClick={() => setActiveSidebarItem("Mein EVENTIM")}
                >
                    <span className="icon">🏠</span>
                    <span>Mein EVENTIM</span>
                </div>
                <div
                    className={`sidebar-item ${
                        activeSidebarItem === "Meine Events" ? "active" : ""
                    }`}
                    onClick={() => setActiveSidebarItem("Meine Events")}
                >
                    <span className="icon">🎫</span>
                    <span>Meine Events</span>
                </div>
                <div
                    className={`sidebar-item ${
                        activeSidebarItem === "FanBonus" ? "active" : ""
                    }`}
                    onClick={() => setActiveSidebarItem("FanBonus")}
                >
                    <span className="icon">⭐</span>
                    <span>FanBonus</span>
                </div>
                <div style={{ flex: 1 }} />
                <div className="sidebar-footer">
                    <div className="sidebar-footer-title">Konto &amp; Einstellungen</div>
                    <div
                        className={`sidebar-item ${
                            activeSidebarItem === "Kontakteinstellungen" ? "active" : ""
                        }`}
                        onClick={() => setActiveSidebarItem("Kontakteinstellungen")}
                    >
                        <span className="icon">✉️</span>
                        <span>Kontakteinstellungen</span>
                    </div>
                    <div
                        className={`sidebar-item ${
                            activeSidebarItem === "Meine Daten" ? "active" : ""
                        }`}
                        onClick={() => setActiveSidebarItem("Meine Daten")}
                    >
                        <span className="icon">👤</span>
                        <span>Meine Daten</span>
                    </div>
                </div>
            </aside>

            {/* ================= Hauptbereich ================= */}
            <main className="main-content">
                {/*
          .inner-container legt die maximale Breite fest auf:
            5 × 180px (Kartenbreiten)
            + 4 × 1rem (Lücken)
            + 2 × 1rem (horizontaler Rahmen/Padding in der weißen Box)
          Ergebnis: calc(5 * 180px + 6 * 1rem)
        */}
                <div className="inner-container">
                    {/* ===== Weiße Box „Meine Events“ ===== */}
                    <div className="white-box events-white-box">
                        {/* – Header „Meine Events ›“ – */}
                        <div className="content-inner">
                            <div className="events-header">
                                <h1>Meine Events</h1>
                                <span className="arrow">›</span>
                            </div>
                            <p className="subtitle">Alle bevorstehenden Events</p>
                        </div>

                        {/*
              – Blauer Platzhalter-Bereich –
              Er ist in .content-inner mit horizontalem Padding,
              damit er nicht bis an die weißen Ränder reicht.
            */}
                        <div className="blue-placeholder">
                            <div className="content-inner">
                                {blueCards.length === 0 && (
                                    <div className="blue-placeholder-text">
                                        Es ist ziemlich leer hier
                                        <br />
                                        Hier sind einige Empfehlungen für dich
                                    </div>
                                )}
                                <div className="cards-container">
                                    <div className="blue-cards">
                                        {blueCards.map((tour) => (
                                            <SquareTourCard
                                                key={tour.imageId}
                                                imageId={tour.imageId}
                                                title={tour.title}
                                                priceText={tour.priceText}
                                                link={tour.link}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="content-inner">
                            <h3>Empfehlungen basierend auf deinen letzten Buchungen</h3>
                            <div className="carousel-container">
                                <div className="carousel-wrapper">
                                    <button
                                        className="carousel-button left"
                                        onClick={handlePrev}
                                        disabled={carouselIndex === 0}
                                    >
                                        ‹
                                    </button>
                                    <div className="carousel-track">
                                        {visibleSlice.map((tour, idx) => (
                                            <SquareTourCard
                                                key={carouselIndex + idx}
                                                imageId={tour.imageId}
                                                title={tour.title}
                                                priceText={tour.priceText}
                                                link={tour.link}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="carousel-button right"
                                        onClick={handleNext}
                                        disabled={
                                            carouselIndex >= sampleTourData.length - VISIBLE_COUNT
                                        }
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== Weiße Box „Help Center / FAQ“ ===== */}
                    <div className="white-box help-white-box">
                        <div className="content-inner">
                            <section className="help-section">
                                <h2>Help Center / FAQ</h2>
                                <p className="subtitle">Die häufigsten Fragen</p>
                                <div className="faq-placeholder">
                                    <div>FAQ-Box 1</div>
                                    <div>FAQ-Box 2</div>
                                    <div>FAQ-Box 3</div>
                                    <div>FAQ-Box 4</div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}