import React, { useState } from 'react';

const sampleEvent = {
    title: 'AB/CD',
    date: 'Samstag, 27.09.2025',
    time: '20:30',
    location: 'KAISERSLAUTERN',
    venue: 'Irish House',
    imageUrl: '/pictures/sample-event.jpg',
    categories: [
        {
            id: 1,
            name: 'Kategorie 1',
            description: 'Eintrittskarte',
            type: 'Normalpreis',
            price: 23.69,
        },
        {
            id: 2,
            name: 'Kategorie 2',
            description: 'Eintrittskarte',
            type: 'Normalpreis',
            price: 28.50,
        },
        // …add more if you need
    ],
};

export default function EventPage() {
    const [qty, setQty] = useState(1);
    const [selectedCat, setSelectedCat] = useState(sampleEvent.categories[0].id);

    const currentCat = sampleEvent.categories.find(c => c.id === selectedCat);
    const total = (qty * currentCat.price).toFixed(2).replace('.', ',');

    return (
        <div className="event-container">
            {/* ————— HEADER ————— */}
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{sampleEvent.title}</h1>
                    <div className="event-meta">
                        <div className="meta-item">
                            <span className="icon-calendar" /> {sampleEvent.date} | {sampleEvent.time}
                        </div>
                        <div className="meta-item">
                            <span className="icon-location" /> {sampleEvent.location} |{' '}
                            <a href="#" className="venue-link">{sampleEvent.venue}</a>
                        </div>
                    </div>
                </div>
                <div className="event-hero">
                    <img src={sampleEvent.imageUrl} alt={sampleEvent.title} />
                </div>
            </header>

            {/* ————— TICKET PICKER ————— */}
            <section className="ticket-section">
                <div className="ticket-card">
                    {/* 1. Anzahl */}
                    <div className="card-row">
                        <div className="row-label">1. Bitte wähle die Anzahl der Tickets:</div>
                        <div className="row-control">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                            <span className="qty-value">{qty}</span>
                            <button onClick={() => setQty(q => q + 1)}>+</button>
                        </div>
                    </div>

                    {/* 2. Kategorie */}
                    <div className="card-row">
                        <div className="row-label">2. Bitte wähle die Platzkategorie:</div>
                    </div>

                    {/* Kategorien */}
                    {sampleEvent.categories.map(cat => (
                        <div
                            key={cat.id}
                            className={`category-item${selectedCat === cat.id ? ' selected' : ''}`}
                            onClick={() => setSelectedCat(cat.id)}
                        >
                            <div className="col name">
                                <div className="cat-name">{cat.name}</div>
                                <div className="cat-desc">{cat.description}</div>
                            </div>
                            <div className="col type">{cat.type}</div>
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
                        <a href="#"> Buchungsgebühr von max. € 0,00</a><br/>
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