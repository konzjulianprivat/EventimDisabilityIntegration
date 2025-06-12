// javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

export default function FilterBar({
                                      items,
                                      onFiltered,
                                      entityName,
                                      entityRoute,
                                      filterFields,
                                      // Tours filter props
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
    const [queries, setQueries] = useState(
        filterFields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
    );

    const toggleCategory = (cat) =>
        filterCategories.includes(cat)
            ? setFilterCategories(filterCategories.filter((c) => c !== cat))
            : setFilterCategories([...filterCategories, cat]);

    const toggleArtist = (artist) =>
        filterArtists.includes(artist)
            ? setFilterArtists(filterArtists.filter((a) => a !== artist))
            : setFilterArtists([...filterArtists, artist]);

    const applyFilters = () => {
        const filtered = items.filter((item) => {
            const textOk = filterFields.every(({ key, match }) => {
                const q = (queries[key] || '').trim().toLowerCase();
                if (!q) return true;
                const val = (item[key] || '').toString().toLowerCase();
                return match === 'startsWith' ? val.startsWith(q) : val.includes(q);
            });
            if (!textOk) return false;

            if (filterCategories.length > 0 && Array.isArray(item.events)) {
                const hasAcc = item.events.some(ev =>
                    Array.isArray(ev.accessibility) &&
                    ev.accessibility.some(lbl => filterCategories.includes(lbl))
                );
                if (!hasAcc) return false;
            }

            if (filterArtists.length > 0 && Array.isArray(item.artistsList)) {
                const hasArt = item.artistsList.some(name => filterArtists.includes(name));
                if (!hasArt) return false;
            }
            return true;
        });

        onFiltered(filtered);
    };

    useEffect(applyFilters, [
        queries,
        items,
        filterCategories,
        filterArtists,
    ]);

    const handleFieldChange = (key, val) =>
        setQueries((prev) => ({ ...prev, [key]: val }));

    return (
        <div className="filter-bar-container">
            <div className="filter-bar-main">
                {filterFields
                    .filter((f) => f.match === 'startsWith')
                    .map((f) => (
                        <input
                            key={f.key}
                            type="text"
                            className="filter-input"
                            placeholder={`\\${f.label} suchen…`}
                            value={queries[f.key]}
                            onChange={(e) =>
                                handleFieldChange(f.key, e.target.value)
                            }
                        />
                    ))}
                <button
                    className="btn-toggle-filters"
                    onClick={() => setShowFilters((s) => !s)}
                >
                    {showFilters ? 'Filter verbergen ▲' : 'Filter öffnen ▼'}
                </button>
            </div>
            {showFilters && (
                <div className="filter-bar-advanced">
                    {filterFields
                        .filter((f) => f.match === 'contains')
                        .map((f) => (
                            <div className="filter-row" key={f.key}>
                                <label
                                    className="filter-label"
                                    htmlFor={`${f.key}-filter`}
                                >
                                    {f.label} enthält:
                                </label>
                                <input
                                    id={`${f.key}-filter`}
                                    type="text"
                                    className="filter-input-adv"
                                    placeholder={`z.B. \\${f.label}…`}
                                    value={queries[f.key]}
                                    onChange={(e) =>
                                        handleFieldChange(f.key, e.target.value)
                                    }
                                />
                            </div>
                        ))}
                    {entityName === 'Tour' && (
                        <>
                            <div className="filter-tour-advanced">
                                <div className="filter-tour-row">
                                    <label className="filter-tour-label">
                                        Start:
                                        <input
                                            type="date"
                                            className="filter-date-input"
                                            value={filterStartDate}
                                            onChange={(e) =>
                                                setFilterStartDate(e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="filter-tour-label">
                                        Ende:
                                        <input
                                            type="date"
                                            className="filter-date-input"
                                            value={filterEndDate}
                                            onChange={(e) =>
                                                setFilterEndDate(e.target.value)
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="filter-tour-row">
                                    <label className="filter-tour-label">
                                        Stadt:
                                        <select
                                            className="filter-select"
                                            value={filterCity}
                                            onChange={(e) =>
                                                setFilterCity(e.target.value)
                                            }
                                        >
                                            <option value="">— Stadt wählen —</option>
                                            {cityOptions.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="filter-tour-label">
                                        Venue:
                                        <select
                                            className="filter-select"
                                            value={filterVenue}
                                            onChange={(e) =>
                                                setFilterVenue(e.target.value)
                                            }
                                        >
                                            <option value="">— Venue wählen —</option>
                                            {venueOptions.map((v) => (
                                                <option key={v} value={v}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="filter-tour-fieldset">
                                    <div className="filter-fieldset-legend">
                                        Kategorien:
                                    </div>
                                    <div className="filter-checkbox-group">
                                        {categoryOptions.map((opt) => (
                                            <label
                                                key={opt}
                                                className="filter-checkbox-label"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filterCategories.includes(opt)}
                                                    onChange={() => toggleCategory(opt)}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="filter-tour-row">
                                    <div className="filter-tour-fieldset">
                                        <div className="filter-fieldset-legend">
                                            Künstler:
                                        </div>
                                        <div className="filter-checkbox-group">
                                            {artistOptions.map((a) => (
                                                <label
                                                    key={a}
                                                    className="filter-checkbox-label"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={filterArtists.includes(a)}
                                                        onChange={() => toggleArtist(a)}
                                                    />
                                                    {a}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
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