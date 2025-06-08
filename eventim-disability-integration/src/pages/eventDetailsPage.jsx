import React, { useState } from 'react';

const eventDetailsPage = {
    title: 'Clueso - Weihnachten zu Hause',
    date: 'Montag, 29.12.2025 | 19:30',
    location: 'ERFURT | Messehalle Erfurt',
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
                <div className="event-header">
                    <div className="event-info">
                        <h1>{eventDetailsPage.title}</h1>
                        <p><strong>{eventDetailsPage.date}</strong></p>
                        <p>{eventDetailsPage.location}</p>
                    </div>
                    <div className="event-image">
                        <img
                            src="/pictures/TestPictures/Test-Picture-EventCard.jpg"
                            alt="Event Banner"
                            className="banner-img"
                        />
                    </div>
                </div>

                <div className="ticket-section">
                    <div className="ticket-box">
                        <h3>Bestplatzbuchung</h3>
                        <p>Du wählst den Preis - wir die besten verfügbaren Plätze</p>
                    </div>

                    <h4 className="ticket-heading">1. Bitte wähle die Anzahl der Tickets:</h4>
                    <div className="quantity-selector">
                        <button onClick={() => handleQuantity(-1)}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => handleQuantity(1)}>+</button>
                    </div>

                    <h4 className="ticket-heading">2. Bitte wähle die Platzkategorie:</h4>
                    <div className="categories">
                        {eventDetailsPage.categories.map((cat) =>
                            cat.show !== false ? (
                                <div
                                    key={cat.id}
                                    className={`category-card ${cat.available ? 'available' : 'unavailable'}`}
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
                                            className="radio-btn"
                                        />
                                    </div>
                                </div>
                            ) : null
                        )}
                    </div>

                    {selectedCategory && (
                        <div className="summary-box">
                            <strong>{quantity} Ticket(s), € {total.toFixed(2)}</strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
