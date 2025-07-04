import React, {Fragment, useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../../config';
import { useAuth } from '../../../../../hooks/useAuth';
import { useCart } from "../../../../../hooks/useCart";

export default function EventPage() {
    const router = useRouter();
    const { artist, tour, event } = router.query;

    const { loading: authLoading, loggedIn, user } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [bookingForMe, setBookingForMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [qty, setQty] = useState(1);
    const [qty_disabled, setQty_disabled] = useState(1);
    const [selectedCat, setSelectedCat] = useState(null);

    // Track category IDs already in cart
    const [inCartItems, setInCartItems] = useState({});
    const { reload: reloadCart, items: cartItems, counts } = useCart();

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [lastClickedSection, setLastClickedSection] = useState(null);  // 'disabled' or 'regular'
    const [addDisabled, setAddDisabled] = useState(false);
    const [assistanceInCart, setAssistanceInCart] = useState(false);

    // Redirect to 404 page if event data could not be loaded within 3 seconds
    useEffect(() => {
        if (!artist || !tour || !event) return;
        const timer = setTimeout(() => {
            if (!eventData) router.replace('/404');
        }, 3000);
        return () => clearTimeout(timer);
    }, [artist, tour, event, eventData]);

    // Build lookup table for items currently in cart
    useEffect(() => {
        if (!loggedIn) {
            setInCartItems({});
            return;
        }
        const map = {};
        (cartItems || []).forEach((i) => {
            if (i.is_assistance_ticket) return;
            map[i.event_category_id] = { id: i.id, quantity: i.quantity };
        });
        setInCartItems(map);
        const hasAssistance = (cartItems || []).some(
            (i) => i.event_id === event && i.is_assistance_ticket
        );
        setAssistanceInCart(hasAssistance);
    }, [loggedIn, cartItems, event]);

    useEffect(() => {
        if (assistanceInCart) {
            setBookingForMe(false);
        }
    }, [assistanceInCart]);


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
    const notExpired = user?.disabilityCardExpiryDate && new Date(user.disabilityCardExpiryDate) >= new Date();
    const showDisabledSection =
        loggedIn && user?.isCurrentlyDisabled && notExpired && categories.some(
            (c) => c.disability_support_for && userMarks.includes(c.disability_support_for.trim())
        );

    const requiresAssistance = userMarks.some((mark) => mark.trim() === 'B');

    const disabledCategories = categories.filter(
        (c) =>
            c.disability_support_for != null &&
            loggedIn &&
            user?.isCurrentlyDisabled &&
            notExpired &&
            userMarks.includes(c.disability_support_for.trim())
    );

    const regularCategories = categories.filter(
        (c) => c.disability_support_for == null
    );

    const eventCounts = counts[event] || { regular: 0, disabled: 0 };

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

    // now compute the display-only quantities (UI shows +1 when bookingForMe)
    const displayQty = (requiresAssistance && bookingForMe && isRegularCatSelected)
        ? qty + 1
        : qty;

    const displayQtyDisabled = (requiresAssistance && bookingForMe && isDisabledCatSelected)
        ? qty_disabled + 1
        : qty_disabled;

    // only show real total when that section is active
    const total = isRegularCatSelected
        ? (qty * (currentCat.price || 0)).toFixed(2).replace('.', ',')
        : '0,00';
    const total_disabled = isDisabledCatSelected
        ? (qty_disabled * (currentCat_disabled.price || 0)).toFixed(2).replace('.', ',')
        : '0,00';

    // Handler to add selected item to cart
    const handleAddToCart = async () => {
        // prevent spamming: disable button for 3s
        setAddDisabled(true);
        setTimeout(() => setAddDisabled(false), 3000);

        if (!loggedIn) {
            const redirect = encodeURIComponent(router.asPath);
            router.push(`/login?redirect=${redirect}`);
            return;
        }

        const existing = inCartItems[selectedCat];

        // If regular and already in cart, PATCH new quantity
        if (existing && isRegularCatSelected) {
            const newQty = existing.quantity + qty;
            const newTotal = eventCounts.regular - existing.quantity + newQty;
            if (newTotal > 8) {
                setLastClickedSection('regular');
                setErrorMessage(`Maximal ${8 - (eventCounts.regular - existing.quantity)} weitere Tickets möglich.`);
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
                reloadCart();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setLastClickedSection('regular');
                setErrorMessage('Aktualisierung fehlgeschlagen.');
                setTimeout(() => setErrorMessage(''), 3000);
            }
            return;
        }

        // Otherwise (new item OR disabled), do POST
        if (isDisabledCatSelected && eventCounts.disabled >= 1) {
            setLastClickedSection('disabled');
            setErrorMessage('Es kann nur ein Behinderten-Ticket gebucht werden.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }
        if (isRegularCatSelected && eventCounts.regular + qty > 8) {
            setLastClickedSection('regular');
            setErrorMessage(`Maximal ${8 - eventCounts.regular} weitere Tickets möglich.`);
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }
        const payload = {
            eventId: event,
            eventCategoryId: selectedCat,
            quantity: isDisabledCatSelected ? qty_disabled : qty,
            price: Number(
                ((isDisabledCatSelected ? currentCat_disabled.price : currentCat.price) || 0)
                    .toFixed(2)
            ),
            isAssistanceTicket: false,
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
                if (requiresAssistance && bookingForMe) {
                    await fetch(`${API_BASE_URL}/cart-items`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId: event,
                            eventCategoryId: selectedCat,
                            quantity: 1,
                            price: 0,
                            isAssistanceTicket: true,
                        }),
                    });
                }
                setLastClickedSection(isDisabledCatSelected ? 'disabled' : 'regular');
                setSuccessMessage('Erfolgreich zum Warenkorb hinzugefügt!');
                setErrorMessage('');
                reloadCart();
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
                            <span className="icon-location" /> {eventData.cityName} | {eventData.venueName}
                        </div>
                    </div>
                </div>
                <div className="event-hero">
                    <img
                        src={
                            eventData.tourImage
                                ? `${API_BASE_URL}/image/${eventData.tourImage}`
                                : '/pictures/placeholder.png'
                        }
                        alt={eventData.tourTitle || 'Event'}
                    />
                </div>
            </header>

            {(showDisabledSection || requiresAssistance) && (
                <section className="ticket-section" style={{
                    paddingBottom: (requiresAssistance && !showDisabledSection) ? 0 : undefined,
                }}>
                    <label className="new-label">NEW</label>
                    <h2 className="section-title">Ticketbuchung für Menschen mit Schwerbehinderung</h2>
                    {requiresAssistance && (
                        <div className="toggle-container">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={bookingForMe}
                                    disabled={assistanceInCart}
                                    onChange={() => setBookingForMe(!bookingForMe)}
                                />
                                <span className="slider"/>
                            </label>
                            <span className="toggle-label">
                          {bookingForMe ? 'Buchung für mich (inkl. Begleitung)' : 'Buchung für andere Personen'}
                      </span>
                        </div>
                    )}
                    { showDisabledSection && (
                    <div className="ticket-card" style={{borderColor: "purple", boxShadow: "0 0 4px 2px #8000804D, 0 0 6px 3px #80008099, 0 0 8px 4px #800080FF"}}>
                        {/* 1. Anzahl */}
                        <div className="card-row">
                            <div className="row-label">
                                1. Bitte wähle die Anzahl der Tickets:
                                <div className="row-note">
                                    Bitte beachte, dass du nur Tickets für dich {requiresAssistance ? 'und deine Begleitperson' : 'selbst'} buchen kannst.
                                </div>
                            </div>
                            {requiresAssistance && bookingForMe && isDisabledCatSelected && (
                                <div className="row-control">
                                    <div className="row-note" style={{color: "purple"}}>
                                        <img src="/pictures/info_icon_new.png" alt="Info" style={{maxWidth: "15px", maxHeight: "15px"}} />
                                        Deine Begleitperson wird automatisch mitgebucht.
                                    </div>
                                </div>
                            )}
                            <div className="row-control">
                                <button
                                    onClick={() => setQty_disabled((q) => Math.max(1, q - 1))}
                                    disabled={!isDisabledCatSelected || qty_disabled <= 1}
                                >−</button>
                                <span className="qty-value">{qty_disabled} {(requiresAssistance && isDisabledCatSelected && bookingForMe) ? <a style={{color: "purple"}}>+ 1</a> : ''}</span>
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
                                    <div className="cat-desc">{cat.area_description}</div>
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
                                    Boolean(inCartItems[selectedCat]) ||
                                    eventCounts.disabled >= 1
                                }
                                onClick={handleAddToCart}
                            >
                                <span className="icon-cart" />{' '}
                                {`${displayQtyDisabled} Ticket${displayQtyDisabled > 1 ? 's' : ''}`}, € {total_disabled}
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
                    )}
                </section>
            )}

            {/* ————— TICKET PICKER ————— */}
            <section className="ticket-section" style={{
                marginTop: (requiresAssistance && !showDisabledSection) ? 0 : undefined,
                paddingTop: (requiresAssistance && !showDisabledSection) ? 0 : undefined,

            }}>
                {(!requiresAssistance || showDisabledSection) && (<h2 className="section-title">Reguläre Tickets buchen</h2>)}
                <div className="ticket-card">
                    {/* 1. Anzahl */}
                    <div className="card-row">
                        <div className="row-label">
                            1. Bitte wähle die Anzahl der Tickets:
                            <div className="row-note">Bitte beachte, dass du nur maximal 8 Tickets auf einmal buchen kannst.</div>
                        </div>
                        {requiresAssistance && bookingForMe && isRegularCatSelected && (
                            <div className="row-control">
                                <div className="row-note" style={{color: "purple"}}>
                                    <img src="/pictures/info_icon_new.png" alt="Info" style={{maxWidth: "15px", maxHeight: "15px"}} />
                                    Deine Begleitperson wird automatisch mitgebucht.
                                </div>
                            </div>
                        )}
                        <div className="row-control">
                            <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                disabled={!isRegularCatSelected || qty <= 1}
                            >−</button>
                            <span className="qty-value">{qty} {(requiresAssistance && isRegularCatSelected && bookingForMe) ? <a style={{color: "purple"}}>+ 1</a> : ''}</span>
                            <button
                                onClick={() => setQty((q) => Math.min(8 - eventCounts.regular, q + 1))}
                                disabled={!isRegularCatSelected || qty >= (8 - eventCounts.regular)}
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
                                    {cat.venue_area_names.map((n) => n.split(' - ').join(' ')).join(', ')}
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
                            disabled={addDisabled || !isRegularCatSelected || eventCounts.regular >= 8}
                            onClick={handleAddToCart}
                        >
                            <span className="icon-cart" />{' '}
                            {`${displayQty} Ticket${displayQty > 1 ? 's' : ''}`}, € {total}
                        </button>
                    </div>

                    {/* Note */}
                    <div className="note">
                        Angezeigte Preise inkl. der gesetzl. MwSt., Vorverkaufsgebühr,
                        <a href="src/pages/404.jsx"> Buchungsgebühr von max. € 0,00</a>
                        <br />
                        zzgl. <a href="src/pages/404.jsx">Versandkosten</a>.
                    </div>
                </div>

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