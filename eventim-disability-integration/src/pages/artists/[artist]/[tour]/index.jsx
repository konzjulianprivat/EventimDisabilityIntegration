import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../../config';
import FilterBar from "../../../../components/filter-bar";

export default function TourEventsPage() {
    const router = useRouter();
    const { artist, tour } = router.query;

    const [tourData, setTourData] = useState(null);
    const [events, setEvents] = useState([]);

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
                            <span className="icon-location" /> {totalDistinctCityNames} Städte | {totalDistinctVenueNames} Arenen | {tourData.eventCount} Events
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
                        return (
                            <div className="artist-card" key={ev.id}>
                                <div className="card-body">
                                    <div className="details-wrapper">
                                        <div
                                            className="tour-header hoverable"
                                            onClick={() => router.push(evUrl)}
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
                                            <div className="no-availability-message">
                                                Das Event ist ausverkauft!
                                            </div>
                                            <div className="availability-limited-message">
                                                Es sind nur noch weniger als 20% der Tickets verfügbar!
                                            </div>
                                            <div className="availability-message">
                                                Tickets stehen zur Verfügung!
                                            </div>

                                            <div className="header-right">
                                                <button
                                                    className="btn-view-events"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(evUrl);
                                                    }}
                                                >
                                                    Tickets
                                                </button>
                                                <button
                                                    className="btn-view-events"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(evUrl);
                                                    }}
                                                    style={{backgroundColor: 'lightgrey'}}
                                                >
                                                    Tickets (but diabled)
                                                </button>
                                                Here, your task is to implement that only one of the labels above is displayed depending on the capacity of the event.
                                                For that event, the total capacity of all event_categories should be looked at (total of all event_category capacities)
                                                If it hits 20% rest capacity the orange label should be displayed if all event_categories that are bookable for that person are 0 the red label should be displayed.
                                                Sometimes, if the user is disabled and can book more categories, the label shows 20% whereas for regular users it shows sold out.
                                                If the red label is presented, the ticket label should be displayed as grey.
                                                You can get the current capacity by counting the total tickets for that event for that event_category and substracting that from the total of that event_category.
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

