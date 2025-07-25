import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../config';
import { useAuth } from '../../../../hooks/useAuth';

export default function VenueEventsPage() {
    const router = useRouter();
    const { city, venue } = router.query;

    const { loggedIn, user } = useAuth();

    const [venueData, setVenueData] = useState(null);
    const [events, setEvents] = useState([]);
    const [availability, setAvailability] = useState({});

    useEffect(() => {
        if (!city || !venue) return;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/cities-with-venues`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const c = (data.cities || []).find((ci) => ci.id === city);
                const v = c && (c.venues || []).find((ve) => ve.id === venue);
                if (!c || !v) throw new Error();
                setVenueData({ id: v.id, name: v.name, cityName: c.name });

                const toursRes = await fetch(`${API_BASE_URL}/tours-detailed`, {
                    credentials: 'include',
                });
                if (!toursRes.ok) throw new Error();
                const toursJson = await toursRes.json();
                const tours = Array.isArray(toursJson.tours) ? toursJson.tours : [];
                const evs = [];
                tours.forEach((t) => {
                    (t.events || []).forEach((ev) => {
                        if (ev.cityName === c.name && ev.venueName === v.name) {
                            evs.push({
                                ...ev,
                                tourId: t.id,
                                artistIds: t.artistIds,
                                tourTitle: t.title,
                                tourImage: t.tour_image,
                            });
                        }
                    });
                });
                evs.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                setEvents(evs);
            } catch {
                setVenueData(null);
                setEvents([]);
            }
        };
        load();
    }, [city, venue]);

    useEffect(() => {
        if (events.length === 0) return;
        const fetchCaps = async () => {
            const map = {};
            for (const ev of events) {
                try {
                    const res = await fetch(`${API_BASE_URL}/event-capacities/${ev.id}`, {
                        credentials: 'include',
                    });
                    if (!res.ok) continue;
                    const data = await res.json();
                    map[ev.id] = data;
                } catch {}
            }
            setAvailability(map);
        };
        fetchCaps();
    }, [events]);

    if (!venueData) return <div>Loading …</div>;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    const formatTime = (d) =>
        new Date(d).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });

    const totalDistinctCityNames = new Set(events.map((ev) => ev.cityName)).size;
    const totalDistinctVenueNames = new Set(events.map((ev) => ev.venueName)).size;

    return (
        <div className="event-container">
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{venueData.name}</h1>
                    <div className="event-meta" style={{ marginTop: '2rem' }}>
                        <div className="meta-item">
                            <span className="icon-location" /> {totalDistinctCityNames} Städte |{' '}
                            {totalDistinctVenueNames} Arenen | {events.length} Events
                        </div>
                    </div>
                </div>
            </header>

            <div className="artists-wrapper">
                <div className="tours-grid">
                    {events.length === 0 && (
                        <div className="no-artists">Keine Events vorhanden.</div>
                    )}
                    {events.map((ev) => {
                        const firstArt = ev.artistIds?.[0] ?? '';
                        const evUrl = `/artists/${firstArt}/${ev.tourId}/${ev.id}`;
                        const evAcc = Array.from(new Set(ev.accessibility || []));

                        const info = availability[ev.id];
                        let soldOut = false;
                        let limited = false;
                        if (info) {
                            const totalCap = info.totalCapacity || 0;
                            const totalRem = info.totalRemaining || 0;
                            let userRem = 0;
                            if (info.categories) {
                                info.categories.forEach((c) => {
                                    const code = c.disability_support_for && c.disability_support_for.trim();
                                    const notExpired =
                                        user?.disabilityCardExpiryDate &&
                                        new Date(user.disabilityCardExpiryDate) >= new Date();
                                    const canBook =
                                        !code ||
                                        (loggedIn &&
                                            user?.isCurrentlyDisabled &&
                                            notExpired &&
                                            (user.disabilityMarks || []).includes(code));
                                    if (canBook) userRem += c.remaining;
                                });
                            }
                            soldOut = userRem <= 0;
                            limited = !soldOut && totalCap > 0 && totalRem / totalCap <= 0.2;
                        }

                        return (
                            <div className="artist-card" key={ev.id}>
                                <div className="card-body">
                                    <div className="details-wrapper">
                                        <div
                                            className="tour-header hoverable"
                                            onClick={() => router.push(evUrl)}
                                        >
                                            <img
                                                className="artist-image"
                                                src={
                                                    ev.tourImage
                                                        ? `${API_BASE_URL}/image/${ev.tourImage}`
                                                        : '/pictures/placeholder.png'
                                                }
                                                alt={ev.tourTitle || 'Tour'}
                                                style={{ maxWidth: '120px' }}
                                            />
                                            <div>
                                                <h3 className="tour-title">{ev.tourTitle}</h3>
                                                <div className="tour-meta">
                                                    {formatDate(ev.start_time)} | {ev.cityName}
                                                </div>
                                                <div className="tour-meta">
                                                    <span>{formatTime(ev.start_time)}</span>
                                                    <span> • {ev.venueName}</span>
                                                </div>
                                                {evAcc.length > 0 && (
                                                    <div className="tour-accessibility">
                                                        {evAcc.map((lbl) => (
                                                            <span key={lbl} className="access-label-small">
                                                                {lbl}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {soldOut && (
                                                <div className="no-availability-message">
                                                    Das Event ist ausverkauft!
                                                </div>
                                            )}
                                            {!soldOut && limited && (
                                                <div className="availability-limited-message">
                                                    Es sind nur noch weniger als 20% der Tickets verfügbar!
                                                </div>
                                            )}
                                            {!soldOut && !limited && (
                                                <div className="availability-message">Tickets stehen zur Verfügung!</div>
                                            )}

                                            <div className="header-right">
                                                <button
                                                    className="btn-view-events"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(evUrl);
                                                    }}
                                                    style={soldOut ? { backgroundColor: 'lightgrey' } : undefined}
                                                    disabled={soldOut}
                                                >
                                                    Tickets
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
