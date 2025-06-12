import React, {Fragment, useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../../config';

export default function EventPage() {
    const router = useRouter();
    const { artist, tour, event } = router.query;

    const [eventData, setEventData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [qty, setQty] = useState(1);
    const [selectedCat, setSelectedCat] = useState(null);

    useEffect(() => {
        if (!artist || !tour || !event) return;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/event-details/${event}`);
                if (!res.ok) throw new Error('Fetch failed');
                const data = await res.json();

                if (data.event.tour_id !== tour || !(data.artistIds || []).includes(artist)) {
                    setError('Event passt nicht zur Tour oder zum Künstler');
                    setLoading(false);
                    return;
                }

                setEventData(data.event);
                setCategories(data.categories || []);
                setSelectedCat(data.categories && data.categories[0] ? data.categories[0].id : null);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Fehler beim Laden des Events');
                setLoading(false);
            }
        };
        load();
    }, [artist, tour, event]);

    const currentCat = categories.find((c) => c.id === selectedCat) || {};
    const total = (qty * (currentCat.price || 0)).toFixed(2).replace('.', ',');

    if (loading) return <div>Loading …</div>;
    if (error) return <div>{error}</div>;
    if (!eventData) return <div>Event nicht gefunden</div>;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="event-container">
            {/* ————— HEADER ————— */}
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{eventData.tourTitle}</h1>
                    <div className="event-meta">
                        <div className="meta-item">
                            <span className="icon-calendar" /> {formatDate(eventData.start_time)} | {formatTime(eventData.start_time)}
                        </div>
                        <div className="meta-item">
                            <span className="icon-location" /> {eventData.cityName} |{' '}
                            <a href="#" className="venue-link">{eventData.venueName}</a>
                        </div>
                    </div>
                </div>
                <div className="event-hero">
                    <img
                        src={
                            eventData.tourImage
                                ? `${API_BASE_URL}/image/${eventData.tourImage}`
                                : '/placeholder-tour.png'
                        }
                        alt={eventData.tourTitle || 'Event'}
                    />
                </div>
            </header>

            <section className="ticket-section">
                <label className="new-label">NEW</label>
                <h2 className="section-title">Ticketbuchung für Menschen mit Schwerbehinderung</h2>
                <div className="ticket-card" style={{borderColor: "purple"}}>
                    {/* 1. Anzahl */}
                    <div className="card-row">
                        <div className="row-label">
                            1. Bitte wähle die Anzahl der Tickets:
                            <div className="row-note"> Bitte beachte, dass du nur Tickets für dich selbst buchen kannst.</div>
                        </div>
                        <div className="row-control">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                            <span className="qty-value">{qty}</span>
                            <button onClick={() => setQty((q) => q + 1)}>+</button>
                        </div>
                    </div>

                    {/* 2. Kategorie */}
                    <div className="card-row">
                        <div className="row-label">2. Bitte wähle die Platzkategorie:</div>
                    </div>

                    {/* Kategorien */}
                    {categories
                        .filter((cat) => cat.disability_support_for != null)
                        .map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-item${selectedCat === cat.id ? ' selected' : ''}`}
                                onClick={() => setSelectedCat(cat.id)}
                            >
                                <div className="col name">
                                    <div className="cat-name">{cat.name} ({cat.disability_support_for.trim()})</div>
                                    <div className="cat-desc" >ADD AREAS.DESCRIPTION HERE</div>
                                </div>
                                <div className="col type">{cat.disability_support_for == null ? 'Normalpreis': 'Reduzierter Preis'}</div>
                                <div className="col price">
                                    <span>€ {cat.price.toFixed(2).replace('.', ',')}</span>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={selectedCat === cat.id}
                                        readOnly
                                    />
                                </div>
                            </div>
                    ))}

                    {/* Action row */}
                    <div className="action-row">
                        <button className="total-button">
                            <span className="icon-cart" /> {qty} Ticket{qty > 1 ? 's' : ''}, € {total}
                        </button>
                    </div>

                    {/* Note */}
                    <div className="note">
                        Angezeigte Preise inkl. der gesetzl. MwSt., Vorverkaufsgebühr,
                        <a href="#"> Buchungsgebühr von max. € 0,00</a>
                        <br />
                        zzgl. <a href="#">Versandkosten</a>.
                    </div>
                </div>
            </section>

            {/* ————— TICKET PICKER ————— */}
            <section className="ticket-section">
            <h2 className="section-title">Tickets buchen</h2>
                <div className="ticket-card">
                    {/* 1. Anzahl */}
                    <div className="card-row">
                        <div className="row-label">1. Bitte wähle die Anzahl der Tickets:</div>
                        <div className="row-control">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                            <span className="qty-value">{qty}</span>
                            <button onClick={() => setQty((q) => q + 1)}>+</button>
                        </div>
                    </div>

                    {/* 2. Kategorie */}
                    <div className="card-row">
                        <div className="row-label">2. Bitte wähle die Platzkategorie:</div>
                    </div>

                    {/* Kategorien */}
                    {categories
                        .filter((cat) => cat.disability_support_for == null)
                        .map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-item${selectedCat === cat.id ? ' selected' : ''}`}
                                onClick={() => setSelectedCat(cat.id)}
                            >
                                <div className="col name">
                                    <div className="cat-name">{cat.name}</div>
                                    <div className="cat-desc">ADD ALL VENUE_AREAS.NAME FOR THAT CATEGORY HERE</div>
                                </div>
                                <div className="col type">{cat.disability_support_for || 'Normalpreis'}</div>
                                <div className="col price">
                                    <span>€ {cat.price.toFixed(2).replace('.', ',')}</span>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={selectedCat === cat.id}
                                        readOnly
                                    />
                                </div>
                            </div>
                    ))}

                    {/* Action row */}
                    <div className="action-row">
                        <button className="total-button">
                            <span className="icon-cart" /> {qty} Ticket{qty > 1 ? 's' : ''}, € {total}
                        </button>
                    </div>

                    {/* Note */}
                    <div className="note">
                        Angezeigte Preise inkl. der gesetzl. MwSt., Vorverkaufsgebühr,
                        <a href="#"> Buchungsgebühr von max. € 0,00</a>
                        <br />
                        zzgl. <a href="#">Versandkosten</a>.
                    </div>
                </div>

                {/* ————— ACCORDIONS ————— */}
                <div className="accordion">
                    <details>
                        <summary>Versandmöglichkeiten</summary>
                        <div>Hier stehen Ihre Versandoptionen …</div>
                    </details>
                    <details>
                        <summary>Informationen zur Buchung</summary>
                        <div>Buchungsinformationen …</div>
                    </details>
                    <details>
                        <summary>Informationen zum Veranstalter</summary>
                        <div>Veranstalter-Infos …</div>
                    </details>
                </div>
            </section>
        </div>
    );
}
