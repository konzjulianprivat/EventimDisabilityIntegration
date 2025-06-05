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