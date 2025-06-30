import React, { useEffect, useState } from 'react';
import FilterBar from '../../../components/filter-bar';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../hooks/useAuth';

export default function GenresContent() {
    const [genres, setGenres] = useState([]);
    const [filteredGenres, setFilteredGenres] = useState([]);

    const router = useRouter();
    const { user } = useAuth();

    const filterFields = [{ key: 'name', label: 'Name', match: 'startsWith' }];

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/genres-with-subgenres`);
            if (!res.ok) throw new Error();
            const j = await res.json();
            const arr = Array.isArray(j.genres) ? j.genres : [];
            setGenres(arr);
            setFilteredGenres(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Genres:', err);
            setGenres([]);
            setFilteredGenres([]);
        }
    };

    return (
        <div className="artists-wrapper">
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Genres</h2>
                {user?.hasCreationAccess && (
                    <button
                        className="btn-create-entity"
                        onClick={() => router.push('/admin/genres/create')}
                    >
                        + Genre erstellen
                    </button>
                )}
            </div>

            <div className="filter-container">
                <FilterBar
                    items={genres}
                    onFiltered={setFilteredGenres}
                    entityName="Genre"
                    entityRoute="genres"
                    filterFields={filterFields}
                />
            </div>

            <div className="artists-grid">
                {filteredGenres.length === 0 && (
                    <div className="no-artists">Keine Genres vorhanden.</div>
                )}
                {filteredGenres.map((genre) => (
                    <div className="artist-card" key={genre.id}>
                        <div className="card-header">
                            <h3 className="artist-name">{genre.name}</h3>
                        </div>
                        <div className="card-body">
                            <div className="details-wrapper">
                                {genre.subgenres && genre.subgenres.length > 0 ? (
                                    <ul className="sub-list">
                                        {genre.subgenres.map((s) => (
                                            <li key={s.id} className="sub-item">
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="artist-bio">Keine Subgenres vorhanden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

