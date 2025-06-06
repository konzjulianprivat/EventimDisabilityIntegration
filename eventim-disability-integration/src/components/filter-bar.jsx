import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

/**
 * Props:
 *   - items: Array der Objekte, die gefiltert werden sollen
 *   - onFiltered: Callback (Array) => void, wird aufgerufen, sobald sich die gefilterte Liste ändert
 *   - entityName: z.B. "Künstler" (wird für Button‐Label verwendet)
 *   - entityRoute: z.B. "artists" (Pfad für den „Create“-Button: /admin/{entityRoute}/create)
 *   - filterFields: Array von Feldern, die gefiltert werden sollen, z.B.
 *       [
 *         { key: 'name', label: 'Name', match: 'startsWith' },
 *         { key: 'biography', label: 'Biografie', match: 'contains' },
 *         { key: 'website', label: 'Website', match: 'contains' }
 *       ]
 *
 * Die Filter‐Logik:
 *   - Für match === 'startsWith' gilt: item[key].toLowerCase().startsWith(query)
 *   - Für match === 'contains' gilt: item[key].toLowerCase().includes(query)
 */
export default function FilterBar({
                                      items,
                                      onFiltered,
                                      entityName,
                                      entityRoute,
                                      filterFields,
                                  }) {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(false);
    // State: für jedes Feld einen eigenen Query‐String
    const [queries, setQueries] = useState(
        filterFields.reduce((acc, field) => {
            acc[field.key] = '';
            return acc;
        }, {})
    );

    // Erweiterte Filter nur für Touren
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterVenue, setFilterVenue] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterArtists, setFilterArtists] = useState([]);

    const categoryOptions = useMemo(() => {
        if (entityRoute !== 'tours') return [];
        const set = new Set();
        items.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (Array.isArray(ev.accessibility)) {
                        ev.accessibility.forEach((lbl) => set.add(lbl));
                    }
                });
            }
        });
        return Array.from(set);
    }, [items, entityRoute]);

    const venueOptions = useMemo(() => {
        if (entityRoute !== 'tours') return [];
        const set = new Set();
        items.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (ev.venueName) set.add(ev.venueName);
                });
            }
        });
        return Array.from(set);
    }, [items, entityRoute]);

    const cityOptions = useMemo(() => {
        if (entityRoute !== 'tours') return [];
        const set = new Set();
        items.forEach((t) => {
            if (Array.isArray(t.events)) {
                t.events.forEach((ev) => {
                    if (ev.cityName) set.add(ev.cityName);
                });
            }
        });
        return Array.from(set);
    }, [items, entityRoute]);

    const artistOptions = useMemo(() => {
        if (entityRoute !== 'tours') return [];
        const set = new Set();
        items.forEach((t) => {
            if (Array.isArray(t.artistsList)) {
                t.artistsList.forEach((a) => set.add(a));
            }
        });
        return Array.from(set);
    }, [items, entityRoute]);

    // Hilfsfunktion: Filter anwenden, sobald sich queries oder items ändern
    const applyFilters = () => {
        let result = items.filter((item) => {
            return filterFields.every(({ key, match }) => {
                const q = (queries[key] || '').trim().toLowerCase();
                if (!q) return true;

                const value = (item[key] || '').toString().toLowerCase();
                if (match === 'startsWith') {
                    return value.startsWith(q);
                } else if (match === 'contains') {
                    return value.includes(q);
                }
                return true;
            });
        });

        if (entityRoute === 'tours') {
            if (filterStartDate) {
                const start = new Date(filterStartDate);
                result = result.filter((t) => new Date(t.start_date) >= start);
            }
            if (filterEndDate) {
                const end = new Date(filterEndDate);
                result = result.filter((t) => new Date(t.end_date) <= end);
            }
            if (filterVenue) {
                result = result.filter(
                    (t) =>
                        Array.isArray(t.events) &&
                        t.events.some((ev) => ev.venueName === filterVenue)
                );
            }
            if (filterCity) {
                result = result.filter(
                    (t) =>
                        Array.isArray(t.events) &&
                        t.events.some((ev) => ev.cityName === filterCity)
                );
            }
            if (filterArtists.length > 0) {
                result = result.filter(
                    (t) =>
                        Array.isArray(t.artistsList) &&
                        t.artistsList.some((a) => filterArtists.includes(a))
                );
            }
            if (filterCategories.length > 0) {
                result = result.filter(
                    (t) =>
                        Array.isArray(t.events) &&
                        t.events.some(
                            (ev) =>
                                Array.isArray(ev.accessibility) &&
                                ev.accessibility.some((lbl) =>
                                    filterCategories.includes(lbl)
                                )
                        )
                );
            }
        }

        onFiltered(result);
    };

    // Jeden Query‐Änderungsauslöser oder Items‐Update neu filtern
    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        queries,
        items,
        filterStartDate,
        filterEndDate,
        filterCategories,
        filterVenue,
        filterCity,
        filterArtists,
    ]);

    // Bei Änderung eines Input‐Felds queries updaten
    const handleFieldChange = (key, value) => {
        setQueries((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="filter-bar-container">
            <div className="filter-bar-main">
                {/* Die einfache Suchzeile ist jetzt das „Name“-Feld, falls in filterFields */}
                {filterFields
                    .filter((f) => f.match === 'startsWith')
                    .map((field) => (
                        <input
                            key={field.key}
                            type="text"
                            className="filter-input"
                            placeholder={`${field.label} suchen…`}
                            value={queries[field.key]}
                            onChange={(e) =>
                                handleFieldChange(field.key, e.target.value)
                            }
                        />
                    ))}

                <button
                    className="btn-toggle-filters"
                    onClick={() => setShowFilters((prev) => !prev)}
                >
                    {showFilters ? 'Filter verbergen ▲' : 'Filter öffnen ▼'}
                </button>
            </div>

            {showFilters && (
                <div className="filter-bar-advanced">
                    {filterFields
                        .filter((f) => f.match === 'contains')
                        .map((field) => (
                            <div className="filter-row" key={field.key}>
                                <label className="filter-label" htmlFor={`${field.key}-filter`}>
                                    {field.label} enthält:
                                </label>
                                <input
                                    id={`${field.key}-filter`}
                                    type="text"
                                    className="filter-input-adv"
                                    placeholder={`z.B. ${field.label} …`}
                                    value={queries[field.key]}
                                    onChange={(e) =>
                                        handleFieldChange(field.key, e.target.value)
                                    }
                                />
                            </div>
                        ))}

                    {entityRoute === 'tours' && (
                        <div className="tour-advanced-filters">
                            <label>
                                Start:
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                />
                            </label>
                            <label>
                                Ende:
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                />
                            </label>
                            <label>
                                Kategorien:
                                <select
                                    multiple
                                    value={filterCategories}
                                    onChange={(e) =>
                                        setFilterCategories(
                                            Array.from(e.target.selectedOptions, (o) => o.value)
                                        )
                                    }
                                >
                                    {categoryOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Venue:
                                <select
                                    value={filterVenue}
                                    onChange={(e) => setFilterVenue(e.target.value)}
                                >
                                    <option value="">— Venue wählen —</option>
                                    {venueOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Stadt:
                                <select
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                >
                                    <option value="">— Stadt wählen —</option>
                                    {cityOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Künstler:
                                <select
                                    multiple
                                    value={filterArtists}
                                    onChange={(e) =>
                                        setFilterArtists(
                                            Array.from(e.target.selectedOptions, (o) => o.value)
                                        )
                                    }
                                >
                                    {artistOptions.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

FilterBar.propTypes = {
    items: PropTypes.array.isRequired,
    onFiltered: PropTypes.func.isRequired,
    entityName: PropTypes.string.isRequired,
    entityRoute: PropTypes.string.isRequired,
    filterFields: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            match: PropTypes.oneOf(['startsWith', 'contains']).isRequired,
        })
    ).isRequired,
};
