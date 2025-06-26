import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import FilterBar from '../../../components/filter-bar';
import { API_BASE_URL } from '../../../config';

export default function GenrePage() {
    const router = useRouter();
    const { genre } = router.query;

    const [genreData, setGenreData] = useState(null);
    const [subgenres, setSubgenres] = useState([]);
    const [basicFilteredSubgenres, setBasicFilteredSubgenres] = useState([]);
    const [filteredSubgenres, setFilteredSubgenres] = useState([]);

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
        if (!genre) return;
        const loadGenre = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const g = (data.genres || []).find((gr) => gr.id === genre);
                if (g) {
                    setGenreData({ id: g.id, name: g.name });
                    setFilterArtistsInternal([g.name]);
                    setSubgenres(g.subgenres || []);
                }
            } catch {
                setGenreData(null);
                setSubgenres([]);
            }
        };
        loadGenre();
    }, [genre]);

    const [tours, setTours] = useState([]);
    useEffect(() => {
        const fetchTours = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tours-detailed`);
                if (!res.ok) throw new Error();
                const json = await res.json();
                setTours(Array.isArray(json.tours) ? json.tours : []);
            } catch {
                setTours([]);
            }
        };
        fetchTours();
    }, []);

    useEffect(() => {
        if (!genreData) return;
        const arr = subgenres.map((sg) => {
            const sgEvents = [];
            let cheapest = null;
            tours.forEach((t) => {
                const match = t.genresWithSubs?.find(
                    (g) => g.genreId === genre && g.subgenreNames.includes(sg.name)
                );
                if (match) {
                    if (cheapest == null || (t.cheapestPrice != null && t.cheapestPrice < cheapest)) {
                        cheapest = t.cheapestPrice;
                    }
                    (t.events || []).forEach((ev) => {
                        sgEvents.push({ ...ev, tourId: t.id, artistIds: t.artistIds });
                    });
                }
            });
            sgEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            return {
                id: sg.id,
                title: sg.name,
                subtitle: '',
                start_date: sgEvents[0]?.start_time || '',
                end_date: sgEvents[sgEvents.length - 1]?.start_time || '',
                events: sgEvents,
                eventCount: sgEvents.length,
                cheapestPrice: cheapest,
            };
        });
        setBasicFilteredSubgenres(arr);
        setFilteredSubgenres(arr);
    }, [genreData, subgenres, tours, genre]);

    const categoryOptions = React.useMemo(() => {
        const s = new Set();
        basicFilteredSubgenres.forEach((t) =>
            t.events?.forEach((ev) => ev.accessibility?.forEach((lbl) => s.add(lbl)))
        );
        return Array.from(s);
    }, [basicFilteredSubgenres]);
    const venueOptions = React.useMemo(() => {
        const s = new Set();
        basicFilteredSubgenres.forEach((t) =>
            t.events?.forEach((ev) => ev.venueName && s.add(ev.venueName))
        );
        return Array.from(s);
    }, [basicFilteredSubgenres]);
    const cityOptions = React.useMemo(() => {
        const s = new Set();
        basicFilteredSubgenres.forEach((t) =>
            t.events?.forEach((ev) => ev.cityName && s.add(ev.cityName))
        );
        return Array.from(s);
    }, [basicFilteredSubgenres]);

    useEffect(() => {
        let resArr = basicFilteredSubgenres;
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
                filterArtists.includes(genreData.name)
            );
        }
        if (filterCategories.length) {
            resArr = resArr.filter((t) =>
                t.events?.some((ev) =>
                    ev.accessibility?.some((lbl) => filterCategories.includes(lbl))
                )
            );
        }
        setFilteredSubgenres(resArr);
    }, [
        basicFilteredSubgenres,
        filterStartDate,
        filterEndDate,
        filterVenue,
        filterCity,
        filterArtists,
        filterCategories,
        genreData,
    ]);

    const lockedName = genreData?.name || '';
    const setFilterArtists = (arr) => {
        if (!lockedName) return;
        const copy = arr.includes(lockedName) ? arr : [...arr, lockedName];
        setFilterArtistsInternal(copy);
    };

    if (!genreData) return <div>Loading …</div>;

    const totalEventCount = filteredSubgenres.reduce(
        (total, sg) => total + sg.eventCount,
        0
    );

    return (
        <div className="event-container">
            <header className="event-header">
                <div className="header-info">
                    <h1 className="event-title">{genreData.name}</h1>
                    <div className="event-meta">
                        <div className="meta-item">
                            {subgenres.length} Subgenres | {totalEventCount} Events
                        </div>
                    </div>
                </div>
            </header>

            <div className="artists-wrapper">
                <div className="filter-container">
                    <FilterBar
                        items={basicFilteredSubgenres}
                        onFiltered={setBasicFilteredSubgenres}
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
                        artistOptions={lockedName ? [lockedName] : []}
                    />
                </div>

                <div className="tours-grid">
                    {filteredSubgenres.length === 0 && (
                        <div className="no-artists">Keine Touren vorhanden.</div>
                    )}
                    {filteredSubgenres.map((sg) => {
                        const sgUrl = `/genres/${genre}/${sg.id}`;
                        const access = Array.from(
                            new Set((sg.events || []).flatMap((ev) => ev.accessibility || []))
                        );
                        const firstArtist = sg.events[0]?.artistIds?.[0] ?? '';
                        return (
                            <div className="artist-card" key={sg.id}>
                                <div className="card-body">
                                    <div className="image-wrapper tour-image-large">
                                        <img
                                            className="artist-image"
                                            src={'/pictures/placeholder.png'}
                                            alt={sg.title}
                                        />
                                    </div>
                                    <div className="details-wrapper">
                                        <div
                                            className="tour-header hoverable"
                                            onClick={() => router.push(sgUrl)}
                                        >
                                            <div>
                                                <h3 className="tour-title">{sg.title}</h3>
                                                <div className="tour-meta">
                                                    <span>{sg.eventCount} Events</span>
                                                </div>
                                                {access.length > 0 && (
                                                    <div className="tour-accessibility">
                                                        {access.map((lbl) => (
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
                                                    {sg.cheapestPrice != null
                                                        ? sg.cheapestPrice.toFixed(2)
                                                        : '–'}
                                                </div>
                                                <button
                                                    className="btn-view-events"
                                                    onClick={() => router.push(sgUrl)}
                                                >
                                                    Alle {sg.eventCount} Events anzeigen
                                                </button>
                                            </div>
                                        </div>
                                        <div className="sub-events">
                                            {(sg.events || [])
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
                                                    const evUrl = `/artists/${firstArtist}/${ev.tourId}/${ev.id}`;
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
