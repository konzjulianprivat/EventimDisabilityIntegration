import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import FilterBar from '../../../components/filter-bar';
import { API_BASE_URL } from '../../../config';

export default function ArtistPage() {
    const router = useRouter();
    const { artist } = router.query;

    const [artistData, setArtistData] = useState(null);
    const [tours, setTours] = useState([]);
    const [basicFilteredTours, setBasicFilteredTours] = useState([]);
    const [filteredTours, setFilteredTours] = useState([]);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterVenue, setFilterVenue] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterArtists, setFilterArtistsInternal] = useState([]);

    const filterFields = [
        { key: 'title', label: 'Titel', match: 'startsWith' },
        { key: 'subtitle', label: 'Subtitle', match: 'contains' },
        { key: 'start_date', label: 'Startdatum', match: 'equals' },
        { key: 'end_date', label: 'Enddatum', match: 'equals' },
    ];

    useEffect(() => {
        if (!artist) return;
        const loadArtist = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/artist-details/${artist}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setArtistData(data.artist);
                setFilterArtistsInternal([data.artist.name]);
            } catch {
                setArtistData(null);
            }
        };
        loadArtist();
    }, [artist]);

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tours-detailed`);
                if (!res.ok) throw new Error();
                const json = await res.json();
                const arr = Array.isArray(json.tours) ? json.tours : [];
                setTours(arr);
                setBasicFilteredTours(arr);
                setFilteredTours(arr);
            } catch {
                setTours([]);
                setBasicFilteredTours([]);
                setFilteredTours([]);
            }
        };
        fetchTours();
    }, []);

    const categoryOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) =>
                ev.accessibility?.forEach((lbl) => s.add(lbl))
            )
        );
        return Array.from(s);
    }, [tours]);
    const venueOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) => ev.venueName && s.add(ev.venueName))
        );
        return Array.from(s);
    }, [tours]);
    const cityOptions = React.useMemo(() => {
        const s = new Set();
        tours.forEach((t) =>
            t.events?.forEach((ev) => ev.cityName && s.add(ev.cityName))
        );
        return Array.from(s);
    }, [tours]);

    useEffect(() => {
        let resArr = basicFilteredTours;
        if (filterStartDate) {
            const s = new Date(filterStartDate);
            resArr = resArr.filter((t) => new Date(t.start_date) >= s);
        }
        if (filterEndDate) {
            const e = new Date(filterEndDate);
            resArr = resArr.filter((t) => new Date(t.end_date) <= e);
        }
        if (filterVenue) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) => ev.venueName === filterVenue)
            );
        }
        if (filterCity) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) => ev.cityName === filterCity)
            );
        }
        if (filterArtists.length) {
            resArr = resArr.filter((t) =>
                t.artistsList?.some((a) => filterArtists.includes(a))
            );
        }
        if (filterCategories.length) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) =>
                    ev.accessibility?.some((lbl) => filterCategories.includes(lbl))
                )
            );
        }
        setFilteredTours(resArr);
    }, [
        basicFilteredTours,
        filterStartDate,
        filterEndDate,
        filterVenue,
        filterCity,
        filterArtists,
        filterCategories,
    ]);

    const lockedArtistName = artistData?.name || '';
    const setFilterArtists = (arr) => {
        if (!lockedArtistName) return;
        const copy = arr.includes(lockedArtistName)
            ? arr
            : [...arr, lockedArtistName];
        setFilterArtistsInternal(copy);
    };

    if (!artistData) return <div>Loading …</div>;

    const artistImage = artistData.artist_image
        ? `${API_BASE_URL}/image/${artistData.artist_image}`
        : '/pictures/placeholder.png';

    const totalEventCount = filteredTours.reduce((total, tour) => total + tour.eventCount, 0);

    return (
        <div className="event-container">
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{artistData.name}</h1>
                    {artistData.biography && <p>{artistData.biography}</p>}
                    <div className="event-meta">
                        <div className="meta-item">{artistData.tourCount} Touren | {totalEventCount} Events</div>
                        {artistData.website && (
                            <div className="meta-item">
                                <a href={artistData.website} className="venue-link">
                                    {artistData.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
                <div className="event-hero">
                    <img
                        src={
                            artistData.artist_image
                                ? `${API_BASE_URL}/image/${artistData.artist_image}`
                                : '/pictures/placeholder.png'
                        }
                        alt={artistData.name || 'Artist'}
                    />
                </div>
            </header>

            <div className="artists-wrapper">
                <div className="filter-container">
                    <FilterBar
                        items={tours}
                        onFiltered={setBasicFilteredTours}
                        entityName="Tour"
                        entityRoute="tours"
                        filterFields={filterFields}
                        filterStartDate={filterStartDate}
                        setFilterStartDate={setFilterStartDate}
                        filterEndDate={filterEndDate}
                        setFilterEndDate={setFilterEndDate}
                        filterCategories={filterCategories}
                        setFilterCategories={setFilterCategories}
                        categoryOptions={categoryOptions}
                        filterVenue={filterVenue}
                        setFilterVenue={setFilterVenue}
                        venueOptions={venueOptions}
                        filterCity={filterCity}
                        setFilterCity={setFilterCity}
                        cityOptions={cityOptions}
                        filterArtists={filterArtists}
                        setFilterArtists={setFilterArtists}
                        artistOptions={lockedArtistName ? [lockedArtistName] : []}
                    />
                </div>

                <div className="tours-grid">
                    {filteredTours.length === 0 && (
                        <div className="no-artists">Keine Touren vorhanden.</div>
                    )}
                    {filteredTours.map((tour) => {
                        const artId = tour.artistIds?.[0] ?? '';
                        const tourUrl = `/artists/${artId}/${tour.id}`;
                        const tourAccess = Array.from(
                            new Set((tour.events || []).flatMap((ev) => ev.accessibility || []))
                        );
                        return (
                            <div className="artist-card" key={tour.id}>
                                <div className="card-body">
                                    <div className="image-wrapper tour-image-large">
                                        <img
                                            className="artist-image"
                                            src={
                                                tour.tour_image
                                                    ? `${API_BASE_URL}/image/${tour.tour_image}`
                                                    : '/pictures/placeholder.png'
                                            }
                                            alt={tour.title || 'Unbekannte Tour'}
                                        />
                                    </div>
                                    <div className="details-wrapper">
                                        <div className="tour-header hoverable" onClick={() => router.push(tourUrl)}>
                                            <div>
                                                <h3 className="tour-title">{tour.title}</h3>
                                                {tour.subtitle && (
                                                    <p className="tour-subtitle">{tour.subtitle}</p>
                                                )}
                                                <div className="tour-meta">
                                                    <span>
                                                        {new Date(tour.start_date).toLocaleDateString('de-DE')} –{' '}
                                                        {new Date(tour.end_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                    <span>• {tour.eventCount} Events</span>
                                                </div>
                                                {tourAccess.length > 0 && (
                                                    <div className="tour-accessibility">
                                                        {tourAccess.map((lbl) => (
                                                            <span key={lbl} className="access-label-small">
                                                                {lbl}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="header-right">
                                                <div className="price">
                                                    ab €{' '}
                                                    {tour.cheapestPrice != null
                                                        ? tour.cheapestPrice.toFixed(2)
                                                        : '–'}
                                                </div>
                                                <button
                                                    className="btn-view-events"
                                                    onClick={() => router.push(tourUrl)}
                                                >
                                                    Alle {tour.eventCount} Events anzeigen
                                                </button>
                                            </div>
                                        </div>
                                        <div className="sub-events">
                                            {(tour.events || [])
                                                .slice(0, 2)
                                                .map((ev) => {
                                                    const dt = new Date(ev.start_time);
                                                    const ds = dt.toLocaleDateString('de-DE', {
                                                        weekday: 'short',
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    });
                                                    const ts = dt.toLocaleTimeString('de-DE', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    });
                                                    const evAcc = Array.from(new Set(ev.accessibility || []));
                                                    const evUrl = `/artists/${artId}/${tour.id}/${ev.id}`;
                                                    return (
                                                        <div
                                                            key={ev.id}
                                                            className="sub-event-row hoverable"
                                                            onClick={() => router.push(evUrl)}
                                                        >
                                                            <div className="sub-event-info">
                                                                <div className="sub-event-details">
                                                                    {ev.cityName}, {ds}, {ts}
                                                                </div>
                                                                <div className="sub-event-arena">{ev.venueName}</div>
                                                                {evAcc.length > 0 && (
                                                                    <div className="sub-event-accessibility">
                                                                        {evAcc.map((lbl) => (
                                                                            <span key={lbl} className="access-label-small">
                                                                                {lbl}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="btn-tickets"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(evUrl);
                                                                }}
                                                            >
                                                                Tickets
                                                            </button>
                                                        </div>
                                                    );
                                                })}
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
