import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../config';
import FilterBar from "../../../../components/filter-bar";
import { useAuth } from '../../../../hooks/useAuth';

export default function TourEventsPage() {
    const router = useRouter();
    const { artist, tour } = router.query;

    const { loggedIn, user } = useAuth();

    const [tourData, setTourData] = useState(null);
    const [events, setEvents] = useState([]);
    const [availability, setAvailability] = useState({});

    // Redirect to 404 page if tour data could not be loadedithin 3 seconds
    useEffect(() => {
        if (!artist || !tour) return;
        const timer = setTimeout(() => {
            if (!tourData) router.replace('/404');
        }, 3000);
        return () => clearTimeout(timer);
    }, [artist, tour, tourData]);

    useEffect(() => {
        if (!tour) return;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tour-details/${tour}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setTourData(data.tour);
                const evs = Array.isArray(data.tour.events) ? data.tour.events : [];
                evs.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                setEvents(evs);
            } catch (err) {
                console.error(err);
                setTourData(null);
            }
        };
        load();
    }, [tour]);

    useEffect(() => {
        if (events.length === 0) return;
        const fetchCaps = async () => {
            const map = {};
            for (const ev of events) {
                try {
                    const res = await fetch(`${API_BASE_URL}/event-capacities/${ev.id}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    map[ev.id] = data;
                } catch {}
            }
            setAvailability(map);
        };
        fetchCaps();
    }, [events]);

    if (!tourData) return <div>Loading …</div>;

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

    const totalDistinctCityNames = new Set(events.map(ev => ev.cityName)).size;
    const totalDistinctVenueNames = new Set(events.map(ev => ev.venueName)).size;

    return (
        <div className="event-container">
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{tourData.title}</h1>
                    {tourData.subtitle && <p>{tourData.subtitle}</p>}
                    <div className="event-meta" style={{marginTop: "2rem"}}>
                        <div className="meta-item">
                            <span className="icon-calendar" />
                            {new Date(tourData.start_date).toLocaleDateString('de-DE')} –{' '}
                            {new Date(tourData.end_date).toLocaleDateString('de-DE')}
                        </div>
                        <div className="meta-item">
                            <span className="icon-location" /> {totalDistinctCityNames} {totalDistinctCityNames === 1 ? 'Stadt' : 'Städte'} | {totalDistinctVenueNames} Arenen | {tourData.eventCount} Events
                        </div>
                    </div>
                </div>
                <div className="event-hero">
                    <img
                        src={
                            tourData.tour_image
                                ? `${API_BASE_URL}/image/${tourData.tour_image}`
                                : '/pictures/placeholder.png'
                        }
                        alt={tourData.title || 'Tour'}
                    />
                </div>
            </header>

            <div className="artists-wrapper">
                <div className="tours-grid">
                    {events.length === 0 && (
                        <div className="no-artists">Keine Events vorhanden.</div>
                    )}
                    {events.map((ev) => {
                        const evUrl = `/artists/${artist}/${tour}/${ev.id}`;
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
                                    const notExpired = user?.disabilityCardExpiryDate && new Date(user.disabilityCardExpiryDate) >= new Date();
                                    const canBook = !code || (loggedIn && user?.isCurrentlyDisabled && notExpired && (user.disabilityMarks || []).includes(code));
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
                                            onClick={() => !soldOut && router.push(evUrl)}
                                        >
                                            <div>
                                                <h3 className="tour-title">
                                                    {formatDate(ev.start_time)} | {ev.cityName}
                                                </h3>
                                                <div className="tour-meta">
                                                    <span>{formatTime(ev.start_time)}</span>
                                                    <span> • {ev.venueName}</span>
                                                </div>
                                                {evAcc.length > 0 && (
                                                    <div className="tour-accessibility">
                                                        {evAcc.map((lbl) => (
                                                            <span
                                                                key={lbl}
                                                                className="access-label-small"
                                                            >
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
                                                <div className="availability-message">
                                                    Tickets stehen zur Verfügung!
                                                </div>
                                            )}

                                            <div className="header-right">
                                                <button
                                                    className="btn-view-events"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!soldOut) {
                                                            router.push(evUrl);
                                                        }
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

