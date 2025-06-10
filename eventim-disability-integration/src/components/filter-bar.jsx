import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

/**
 * Props:
 *   - items: Array der Objekte, die gefiltert werden sollen
 *   - onFiltered: Callback (Array) => void, wird aufgerufen, sobald sich die gefilterte Liste ändert
 *   - entityName: z.B. "Künstler" (wird für Button‐Label verwendet)
 *   - entityRoute: z.B. "artists" (Pfad für den „Create“-Button: /admin/{entityRoute}/create)
 *   - filterFields: Array von Feldern, die gefiltert werden sollen, z.B.
 *         [
 *           { key: 'name', label: 'Name', match: 'startsWith' },
 *           { key: 'biography', label: 'Biografie', match: 'contains' },
 *           { key: 'website', label: 'Website', match: 'contains' }
 *         ]
 *
 *   - filterStartDate, setFilterStartDate            (String yyyy-MM-dd)
 *   - filterEndDate, setFilterEndDate                  (String yyyy-MM-dd)
 *   - filterCategories, setFilterCategories            (Array of Strings)
 *   - categoryOptions                                  (Array of Strings)
 *   - filterVenue, setFilterVenue                      (String)
 *   - venueOptions                                     (Array of Strings)
 *   - filterCity, setFilterCity                        (String)
 *   - cityOptions                                      (Array of Strings)
 *   - filterArtists, setFilterArtists                  (Array of Strings)
 *   - artistOptions                                    (Array of Strings)
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

                                      // NEUE Props für "Tours"
                                      filterStartDate,
                                      setFilterStartDate,
                                      filterEndDate,
                                      setFilterEndDate,
                                      filterCategories,
                                      setFilterCategories,
                                      categoryOptions,
                                      filterVenue,
                                      setFilterVenue,
                                      venueOptions,
                                      filterCity,
                                      setFilterCity,
                                      cityOptions,
                                      filterArtists,
                                      setFilterArtists,
                                      artistOptions,
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

    // Hilfsfunktion: Filter anwenden, sobald sich queries oder items ändern
    const applyFilters = () => {
        const normalized = items.filter((item) => {
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
        onFiltered(normalized);
    };

    // Jeden Query‐Änderungsauslöser oder Items‐Update neu filtern
    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queries, items]);

    // Bei Änderung eines Input‐Felds queries updaten
    const handleFieldChange = (key, value) => {
        setQueries((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="filter-bar-container">
            <div className="filter-bar-main">
                {/* Die einfache Suchzeile ist jetzt das „startsWith“-Feld(en) */}
                {filterFields
                    .filter((f) => f.match === 'startsWith')
                    .map((field) => (
                        <input
                            key={field.key}
                            type="text"
                            className="filter-input"
                            placeholder={`${field.label} suchen…`}
                            value={queries[field.key]}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        />
                    ))}

                <button
                    className="btn-toggle-filters"
                    onClick={() => setShowFilters((prev) => !prev)}
                >
                    {showFilters ? 'Filter verbergen ▲' : 'Filter öffnen ▼'}
                </button>
                <button
                    className="btn-create-entity"
                    onClick={() => router.push(`/admin/${entityRoute}/create`)}
                >
                    + {entityName} erstellen
                </button>
            </div>

            {showFilters && (
                <div className="filter-bar-advanced">
                    {/* === Text‐Filter (match === 'contains') === */}
                    {filterFields
                        .filter((f) => f.match === 'contains')
                        .map((field) => (
                            <div className="filter-row" key={field.key}>
                                <label
                                    className="filter-label"
                                    htmlFor={`${field.key}-filter`}
                                >
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

                    {/* === TÜRENSPEZIFISCHE ERWEITERTE FILTER (Start, Ende, Kategorien, Venue, Stadt, Künstler) === */}
                    <div className="filter-bar-tour-advanced">
                        <div className="filter-tour-row">
                            <label className="filter-tour-label">
                                Start:
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) =>
                                        setFilterStartDate(e.target.value)
                                    }
                                    className="filter-date-input"
                                />
                            </label>
                            <label className="filter-tour-label">
                                Ende:
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="filter-date-input"
                                />
                            </label>
                        </div>

                        <div className="filter-tour-row">
                            <label className="filter-tour-label">
                                Kategorien:
                                <select
                                    multiple
                                    value={filterCategories}
                                    onChange={(e) =>
                                        setFilterCategories(
                                            Array.from(
                                                e.target.selectedOptions,
                                                (o) => o.value
                                            )
                                        )
                                    }
                                    className="filter-multiselect"
                                >
                                    {categoryOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="filter-tour-label">
                                Venue:
                                <select
                                    value={filterVenue}
                                    onChange={(e) => setFilterVenue(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">— Venue wählen —</option>
                                    {venueOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="filter-tour-row">
                            <label className="filter-tour-label">
                                Stadt:
                                <select
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">— Stadt wählen —</option>
                                    {cityOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="filter-tour-label">
                                Künstler:
                                <select
                                    multiple
                                    value={filterArtists}
                                    onChange={(e) =>
                                        setFilterArtists(
                                            Array.from(
                                                e.target.selectedOptions,
                                                (o) => o.value
                                            )
                                        )
                                    }
                                    className="filter-multiselect"
                                >
                                    {artistOptions.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                    {/* Ende: Tourspezifische erweiterte Filter */}
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

    // Props für erweiterte Tours‐Filter
    filterStartDate: PropTypes.string.isRequired,
    setFilterStartDate: PropTypes.func.isRequired,
    filterEndDate: PropTypes.string.isRequired,
    setFilterEndDate: PropTypes.func.isRequired,
    filterCategories: PropTypes.array.isRequired,
    setFilterCategories: PropTypes.func.isRequired,
    categoryOptions: PropTypes.array.isRequired,
    filterVenue: PropTypes.string.isRequired,
    setFilterVenue: PropTypes.func.isRequired,
    venueOptions: PropTypes.array.isRequired,
    filterCity: PropTypes.string.isRequired,
    setFilterCity: PropTypes.func.isRequired,
    cityOptions: PropTypes.array.isRequired,
    filterArtists: PropTypes.array.isRequired,
    setFilterArtists: PropTypes.func.isRequired,
    artistOptions: PropTypes.array.isRequired,
};