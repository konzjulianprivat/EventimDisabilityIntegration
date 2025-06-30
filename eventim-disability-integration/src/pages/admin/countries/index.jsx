import React, { useEffect, useState } from 'react';
import FilterBar from '../../../components/filter-bar';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../hooks/useAuth';

export default function CountriesContent() {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);

    const router = useRouter();
    const { user } = useAuth();

    const filterFields = [{ key: 'name', label: 'Name', match: 'startsWith' }];

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/countries-with-cities`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            const arr = Array.isArray(j.countries) ? j.countries : [];
            setCountries(arr);
            setFilteredCountries(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Länder:', err);
            setCountries([]);
            setFilteredCountries([]);
        }
    };

    return (
        <div className="artists-wrapper">
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Länder</h2>
                {user?.hasCreationAccess && (
                    <button
                        className="btn-create-entity"
                        onClick={() => router.push('/admin/countries/create')}
                    >
                        + Land erstellen
                    </button>
                )}
            </div>

            <div className="filter-container">
                <FilterBar
                    items={countries}
                    onFiltered={setFilteredCountries}
                    entityName="Land"
                    entityRoute="countries"
                    filterFields={filterFields}
                />
            </div>

            <div className="artists-grid">
                {filteredCountries.length === 0 && (
                    <div className="no-artists">Keine Länder vorhanden.</div>
                )}
                {filteredCountries.map((country) => (
                    <div className="artist-card" key={country.id}>
                        <div className="card-header">
                            <h3 className="artist-name">{country.name}</h3>
                        </div>
                        <div className="card-body">
                            <div className="details-wrapper">
                                {country.cities && country.cities.length > 0 ? (
                                    <ul className="sub-list">
                                        {country.cities.map((c) => (
                                            <li key={c.id} className="sub-item">
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="artist-bio">Keine Städte vorhanden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

