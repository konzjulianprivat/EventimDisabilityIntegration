import React, {Fragment, useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../../config';
import { useAuth } from '../../../../../hooks/useAuth';

export default function EventPage() {
    const router = useRouter();
    const { artist, tour, event } = router.query;

    const { loading: authLoading, loggedIn, user } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [qty, setQty] = useState(1);
    const [qty_disabled, setQty_disabled] = useState(1);
    const [selectedCat, setSelectedCat] = useState(null);

// Track category IDs already in cart
    const [inCartItems, setInCartItems] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [lastClickedSection, setLastClickedSection] = useState(null);  // 'disabled' or 'regular'

// Fetch existing cart items when logged in
    useEffect(() => {
        if (!loggedIn) return;
        (async () => {
            const res = await fetch(`${API_BASE_URL}/cart-items`, { credentials: 'include' });
            if (!res.ok) return;
            const { items } = await res.json();
            // build a lookup by category
            const map = {};
            items.forEach(i => {
                map[i.event_category_id] = { id: i.id, quantity: i.quantity };
            });
            setInCartItems(map);
        })();
    }, [loggedIn]);


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

    const userMarks = (user && user.disabilityMarks) || [];
    const showDisabledSection =
        loggedIn && user?.disabilityCheck && categories.some((c) =>
            c.disability_support_for &&
            userMarks.includes(c.disability_support_for.trim())
        );

    const disabledCategories = categories.filter(
        (c) =>
            c.disability_support_for != null &&
            loggedIn &&
            user?.disabilityCheck &&
            userMarks.includes(c.disability_support_for.trim())
    );

    const regularCategories = categories.filter(
        (c) => c.disability_support_for == null
    );

    useEffect(() => {
        if (categories.length === 0) return;
        const allCats = [
            ...(showDisabledSection ? disabledCategories : []),
            ...regularCategories,
        ];
        if (!selectedCat || !allCats.some((c) => c.id === selectedCat)) {
            setSelectedCat(allCats[0]?.id || null);
        }
    }, [categories, showDisabledSection, loggedIn, authLoading]);

    const currentCat = categories.find((c) => c.id === selectedCat) || {};
    const currentCat_disabled =
        disabledCategories.find((c) => c.id === selectedCat) || {};
    // determine which section is live
    const isDisabledCatSelected = Boolean(currentCat_disabled.id);
    const isRegularCatSelected = !isDisabledCatSelected;

    // only show real total when that section is active
    const total = isRegularCatSelected ? (qty * (currentCat.price || 0)).toFixed(2).replace('.', ',') : '0,00';
    const total_disabled = isDisabledCatSelected ? (qty_disabled * (currentCat_disabled.price || 0)).toFixed(2).replace('.', ',') : '0,00';

    // Handler to add selected item to cart
    const handleAddToCart = async () => {
        if (!loggedIn) {
            const redirect = encodeURIComponent(router.asPath);
            router.push(`/login?redirect=${redirect}`);
            return;
        }

        const existing = inCartItems[selectedCat];

        // If regular and already in cart, PATCH new quantity
        if (existing && isRegularCatSelected) {
            const newQty = existing.quantity + qty;
            if (newQty > 8) {
                setLastClickedSection('regular');
                setErrorMessage(`Maximal ${8 - existing.quantity} weitere Tickets möglich.`);
                setTimeout(() => setErrorMessage(''), 3000);
                return;
            }
            const res = await fetch(
                `${API_BASE_URL}/cart-items/${existing.id}`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQty }),
                }
            );
            if (res.ok) {
                setInCartItems(prev => ({
                    ...prev,
                    [selectedCat]: { ...existing, quantity: newQty },
                }));
                setLastClickedSection('regular');
                setSuccessMessage('Warenkorb aktualisiert!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setLastClickedSection('regular');
                setErrorMessage('Aktualisierung fehlgeschlagen.');
                setTimeout(() => setErrorMessage(''), 3000);
            }
            return;
        }

        // Otherwise (new item OR disabled), do POST
        const payload = {
            eventId: event,
            eventCategoryId: selectedCat,
            quantity: isDisabledCatSelected ? qty_disabled : qty,
            price: Number(
                ((isDisabledCatSelected ? currentCat_disabled.price : currentCat.price) || 0)
                    .toFixed(2)
            ),
        };
        try {
            const res = await fetch(`${API_BASE_URL}/cart-items`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.status === 201) {
                const newItem = await res.json(); // { id, event_category_id, quantity }
                setInCartItems(prev => ({
                    ...prev,
                    [selectedCat]: { id: newItem.id, quantity: newItem.quantity },
                }));
                setLastClickedSection(isDisabledCatSelected ? 'disabled' : 'regular');
                setSuccessMessage('Erfolgreich zum Warenkorb hinzugefügt!');
                setErrorMessage('');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else if (res.status === 409) {
                setLastClickedSection(isDisabledCatSelected ? 'disabled' : 'regular');
                setErrorMessage('Dieser Artikel ist bereits im Warenkorb.');
                setSuccessMessage('');
                setTimeout(() => setErrorMessage(''), 3000);
            } else {
                setLastClickedSection(isDisabledCatSelected ? 'disabled' : 'regular');
                setErrorMessage('Fehler beim Hinzufügen zum Warenkorb.');
                setSuccessMessage('');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            setLastClickedSection(isDisabledCatSelected ? 'disabled' : 'regular');
            setErrorMessage('Fehler beim Hinzufügen zum Warenkorb.');
            setSuccessMessage('');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };


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

            {showDisabledSection && (
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
                            <button
                                onClick={() => setQty_disabled((q) => Math.max(1, q - 1))}
                                disabled={!isDisabledCatSelected || qty_disabled <= 1}
                            >−</button>
                                <span className="qty-value">
                                    {isDisabledCatSelected ? qty_disabled : 1}
                                </span>
                            <button
                                onClick={() => setQty_disabled((q) => Math.min(1, q + 1))}
                                disabled={!isDisabledCatSelected || qty_disabled >= 1}
                            >+</button>
                        </div>
                    </div>

                    {/* 2. Kategorie */}
                    <div className="card-row">
                        <div className="row-label">2. Bitte wähle die Platzkategorie:</div>
                    </div>

                    {/* Kategorien */}
                    {disabledCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-item${selectedCat === cat.id ? ' selected' : ''}`}
                                onClick={() => setSelectedCat(cat.id)}
                            >
                                <div className="col name">
                                    <div className="cat-name">{cat.name} ({cat.disability_support_for.trim()})</div>
                                    <div className="cat-desc" >{cat.area_description}</div>
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
                        {lastClickedSection === 'disabled' && successMessage && (
                            <div className="success-message">{successMessage}</div>
                        )}
                        {lastClickedSection === 'disabled' && errorMessage && (
                            <div className="error-message">{errorMessage}</div>
                        )}
                        <button
                            className="total-button"
                            disabled={
                                !isDisabledCatSelected ||
                                Boolean(inCartItems[selectedCat])
                            }
                            onClick={handleAddToCart}
                        >
                        <span className="icon-cart" />{' '}
                            {isDisabledCatSelected ? `${qty_disabled} Ticket${qty_disabled > 1 ? 's' : ''}` : '1 Ticket'}, € {total_disabled}
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
            )}

            {/* ————— TICKET PICKER ————— */}
            <section className="ticket-section">
            <h2 className="section-title">Reguläre Tickets buchen</h2>
                <div className="ticket-card">
                    {/* 1. Anzahl */}
                    <div className="card-row">
                        <div className="row-label">
                            1. Bitte wähle die Anzahl der Tickets:
                            <div className="row-note"> Bitte beachte, dass du nur maximal 8 Tickets buchen auf einmal buchen kannst.</div>
                        </div>
                        <div className="row-control">
                            <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                disabled={!isRegularCatSelected || qty <= 1}
                            >−</button>
                                <span className="qty-value">
                                    {isRegularCatSelected ? qty : 1}
                                </span>
                            <button
                                onClick={() => setQty((q) => Math.min(8, q + 1))}
                                disabled={!isRegularCatSelected || qty >= 8}
                            >+</button>
                        </div>
                    </div>

                    {/* 2. Kategorie */}
                    <div className="card-row">
                        <div className="row-label">2. Bitte wähle die Platzkategorie:</div>
                    </div>

                    {/* Kategorien */}
                    {regularCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-item${selectedCat === cat.id ? ' selected' : ''}`}
                                onClick={() => setSelectedCat(cat.id)}
                            >
                                <div className="col name">
                                    <div className="cat-name">{cat.name}</div>
                                    <div className="cat-desc">
                                        {cat.venue_area_names
                                            .map((n) => n.split(' - ').join(' '))
                                            .join(', ')}
                                    </div>
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
                        {lastClickedSection === 'regular' && successMessage && (
                            <div className="success-message">{successMessage}</div>
                        )}
                        {lastClickedSection === 'regular' && errorMessage && (
                            <div className="error-message">{errorMessage}</div>
                        )}
                        <button
                            className="total-button"
                            disabled={
                                !isRegularCatSelected ||
                                Boolean(inCartItems[selectedCat])
                            }
                            onClick={handleAddToCart}
                        >
                        <span className="icon-cart" />{' '}
                             {isRegularCatSelected ? `${qty} Ticket${qty > 1 ? 's' : ''}` : '1 Ticket'}, € {total}
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
