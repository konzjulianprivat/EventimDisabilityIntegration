import React, { useState } from 'react';

const eventDetailsPage = {
    title: 'Clueso - Weihnachten zu Hause',
    date: 'Montag, 29.12.2025 | 19:30',
    location: 'ERFURT | Messehalle Erfurt',
    stars: 1392,
    categories: [
        { id: 1, name: 'Kategorie 1', type: 'Sitzplatz', price: 85.0, available: true },
        { id: 2, name: 'Kategorie 2', type: 'Sitzplatz', price: 75.0, available: false },
        { id: 3, name: 'Kategorie 3', type: 'Stehplatz', price: 66.0, available: true },
        { id: 4, name: 'Disabled', type: 'Sitzplatz', price: 45.0, available: true, show: true },
    ],
};

export default function EventDetailsPage() {
    const [quantity, setQuantity] = useState(2);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const handleQuantity = (delta) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const total = selectedCategory
        ? (eventDetailsPage.categories.find((c) => c.id === selectedCategory)?.price || 0) * quantity
        : 0;

    return (
        <div className="page">
            <div className="content">
                {/* Event Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>{eventDetailsPage.title}</h1>
                        <p><strong>{eventDetailsPage.date}</strong></p>
                        <p>{eventDetailsPage.location}</p>
                        <p>{'★'.repeat(5)} ({eventDetailsPage.stars})</p>
                    </div>
                    <div>
                        <img
                            src="[PLATZHALTER_BANNER_BILD]"
                            alt="Event Banner"
                            style={{ width: '300px', borderRadius: '8px' }}
                        />
                    </div>
                </div>

                {/* Ticket Section */}
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '10px', background: '#fff' }}>
                            <h3>Bestplatzbuchung</h3>
                            <p>Du wählst den Preis - wir die besten verfügbaren Plätze</p>
                        </div>
                        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '10px', background: '#fafafa' }}>
                            <h3>Saalplanbuchung</h3>
                            <p>Such dir deinen Platz selbst aus</p>
                        </div>
                    </div>

                    {/* Anzahl */}
                    <h4 style={{ marginTop: '2rem' }}>1. Bitte wähle die Anzahl der Tickets:</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => handleQuantity(-1)}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => handleQuantity(1)}>+</button>
                    </div>

                    {/* Kategorien */}
                    <h4 style={{ marginTop: '2rem' }}>2. Bitte wähle die Platzkategorie:</h4>
                    <div>
                        {eventDetailsPage.categories.map((cat) =>
                            cat.show !== false ? (
                                <div
                                    key={cat.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        marginBottom: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        backgroundColor: cat.available ? '#fff' : '#eee',
                                        color: cat.available ? '#000' : '#aaa',
                                    }}
                                >
                                    <div>
                                        <strong>{cat.name}</strong> <br />
                                        <span>{cat.type}</span>
                                    </div>
                                    <div>
                                        <span>€ {cat.price.toFixed(2)}</span>
                                        <input
                                            type="radio"
                                            name="ticket-category"
                                            disabled={!cat.available}
                                            checked={selectedCategory === cat.id}
                                            onChange={() => setSelectedCategory(cat.id)}
                                            style={{ marginLeft: '1rem' }}
                                        />
                                    </div>
                                </div>
                            ) : null
                        )}
                    </div>

                    {/* Warenkorb */}
                    {selectedCategory && (
                        <div style={{ marginTop: '2rem', background: '#002b55', color: 'white', padding: '1rem', borderRadius: '8px' }}>
                            <strong>{quantity} Ticket(s), € {total.toFixed(2)}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer>
                <div className="content">
                    <p>©️ EVENTIM – Verlinkungen auf rechtliche Hinweise folgen...</p>
                </div>
            </footer>
        </div>
    );
}