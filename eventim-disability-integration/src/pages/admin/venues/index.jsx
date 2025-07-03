import React, { useEffect, useState } from 'react';
import FilterBar from '../../../components/filter-bar';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';

export default function VenuesContent() {
    const [venues, setVenues] = useState([]);
    const [filteredVenues, setFilteredVenues] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        name: '',
        address: '',
        cityId: '',
        website: '',
        venue_image: null,
        existingImageId: null,
    });
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [venueAreas, setVenueAreas] = useState([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const router = useRouter();
    const { user } = useAuth();

    const filterFields = [
        { key: 'name', label: 'Name', match: 'startsWith' },
        { key: 'address', label: 'Adresse', match: 'contains' },
        { key: 'city_name', label: 'Stadt', match: 'contains' },
        { key: 'website', label: 'Website', match: 'contains' },
    ];

    useEffect(() => {
        fetchVenues();
        fetchCities();
        fetchAreas();
    }, []);

    const fetchVenues = async () => {
        try {
            const res = await fetch('http://localhost:4000/venues-detailed');
            const json = await res.json();
            const arr = Array.isArray(json.venues) ? json.venues : [];
            setVenues(arr);
            setFilteredVenues(arr);
        } catch (err) {
            console.error('Fehler beim Laden der Venues:', err);
            setVenues([]);
            setFilteredVenues([]);
        }
    };

    const fetchCities = async () => {
        try {
            const res = await fetch('http://localhost:4000/cities');
            const json = await res.json();
            setCities(json.cities || []);
        } catch (err) {
            console.error('Fehler beim Laden der Städte:', err);
        }
    };

    const fetchAreas = async () => {
        try {
            const res = await fetch('http://localhost:4000/areas');
            const json = await res.json();
            setAreas(json.areas || []);
        } catch (err) {
            console.error('Fehler beim Laden der Areas:', err);
        }
    };

    const handleEditToggle = async (venue) => {
        setEditingId(venue.id);
        setEditedData({
            id: venue.id,
            name: venue.name || '',
            address: venue.address || '',
            cityId: venue.cityId || '',
            website: venue.website || '',
            venue_image: null,
            existingImageId: venue.venue_image || null,
        });
        try {
            const res = await fetch(`http://localhost:4000/venue-areas?venueId=${venue.id}`);
            const json = await res.json();
            const arr = Array.isArray(json.venueAreas) ? json.venueAreas : [];
            setVenueAreas(arr.map((va) => ({ id: va.id, areaId: va.area_id, maxCapacity: va.max_capacity })));
        } catch (err) {
            console.error('Fehler beim Laden der Venue Areas:', err);
            setVenueAreas([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setEditedData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setEditedData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const addArea = () => {
        setVenueAreas((v) => [...v, { id: null, areaId: '', maxCapacity: '' }]);
    };

    const updateArea = (index, field, value) => {
        setVenueAreas((v) =>
            v.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const removeArea = (index) => {
        setVenueAreas((v) => v.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            const fd = new FormData();
            fd.append('name', editedData.name);
            fd.append('address', editedData.address);
            fd.append('cityId', editedData.cityId);
            fd.append('website', editedData.website);
            fd.append('venueAreas', JSON.stringify(venueAreas));
            if (editedData.venue_image instanceof File) {
                fd.append('venue_image', editedData.venue_image);
            }
            const response = await fetch(`http://localhost:4000/venues/${editedData.id}`, {
                method: 'PUT',
                body: fd,
            });
            if (!response.ok) throw new Error('Server-Fehler beim Speichern');
            setEditingId(null);
            fetchVenues();
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:4000/venues/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Server-Fehler beim Löschen');
            setConfirmDeleteId(null);
            fetchVenues();
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    return (
        <div className="artists-wrapper">
            <div className="artists-header">
                <h2 className="artists-title">Übersicht – Venues</h2>
                {user?.hasCreationAccess && (
                    <button
                        className="btn-create-entity"
                        onClick={() => router.push('/admin/venues/create')}
                    >
                        + Venue erstellen
                    </button>
                )}
            </div>

            <div className="filter-container">
                <FilterBar
                    items={venues}
                    onFiltered={(arr) => setFilteredVenues(arr)}
                    entityName="Venue"
                    entityRoute="venues"
                    filterFields={filterFields}
                    filterCategories={[]}
                    setFilterCategories={() => {}}
                    categoryOptions={[]}
                    filterStartDate={''}
                    setFilterStartDate={() => {}}
                    filterEndDate={''}
                    setFilterEndDate={() => {}}
                    filterVenue={''}
                    setFilterVenue={() => {}}
                    venueOptions={[]}
                    filterCity={''}
                    setFilterCity={() => {}}
                    cityOptions={cities.map((c) => c.name)}
                    filterArtists={[]}
                    setFilterArtists={() => {}}
                    artistOptions={[]}
                />
            </div>

            <div className="artists-grid">
                {filteredVenues.length === 0 && (
                    <div className="no-artists">Keine Venues vorhanden.</div>
                )}

                {filteredVenues.map((venue) => (
                    <div className="artist-card" key={venue.id}>
                        <div className="card-header">
                            {editingId === venue.id ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editedData.name}
                                    onChange={handleInputChange}
                                    className="input-name"
                                />
                            ) : (
                                <h3 className="artist-name">{venue.name}</h3>
                            )}

                            {editingId === venue.id ? (
                                <button
                                    className="btn-save"
                                    onClick={handleSave}
                                    title="Speichern"
                                >
                                    💾
                                </button>
                            ) : (
                                user?.hasEditingAccess && (
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditToggle(venue)}
                                        title="Bearbeiten"
                                    >
                                        ✎
                                    </button>
                                )
                            )}
                        </div>

                        <div className="card-body">
                            <div className="image-wrapper">
                                <img
                                    className="artist-image"
                                    src={
                                        editingId === venue.id &&
                                        editedData.venue_image instanceof File
                                            ? URL.createObjectURL(editedData.venue_image)
                                            : venue.venue_image
                                                ? `http://localhost:4000/image/${venue.venue_image}`
                                                : '/pictures/placeholder.png'
                                    }
                                    alt={venue.name || 'Venue'}
                                />
                            </div>
                            <div className="details-wrapper">
                                {editingId === venue.id ? (
                                    <>
                                        <input
                                            type="text"
                                            name="address"
                                            value={editedData.address}
                                            onChange={handleInputChange}
                                            placeholder="Adresse"
                                            className="input-bio"
                                        />
                                        <select
                                            name="cityId"
                                            value={editedData.cityId}
                                            onChange={handleInputChange}
                                            className="input-website"
                                        >
                                            <option value="">Stadt wählen</option>
                                            {cities.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="url"
                                            name="website"
                                            value={editedData.website}
                                            onChange={handleInputChange}
                                            placeholder="Website"
                                            className="input-website"
                                        />
                                        <input
                                            type="file"
                                            name="venue_image"
                                            onChange={handleInputChange}
                                            accept="image/*"
                                            className="input-file"
                                        />

                                        <div style={{ marginBottom: '0.5rem' }}>
                                            {venueAreas.map((va, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: 'flex',
                                                        gap: '0.5rem',
                                                        marginBottom: '0.25rem',
                                                    }}
                                                >
                                                    <select
                                                        value={va.areaId}
                                                        onChange={(e) =>
                                                            updateArea(i, 'areaId', e.target.value)
                                                        }
                                                        className="input-website"
                                                        style={{ flex: 2 }}
                                                    >
                                                        <option value="">Bereich wählen</option>
                                                        {areas.map((a) => (
                                                            <option key={a.id} value={a.id}>
                                                                {a.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={va.maxCapacity}
                                                        onChange={(e) =>
                                                            updateArea(i, 'maxCapacity', e.target.value)
                                                        }
                                                        placeholder="Kapazität"
                                                        className="input-website"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArea(i)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#c00',
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addArea}
                                                className="btn-create-entity"
                                            >
                                                + Bereich hinzufügen
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="details-grid">
                                        <div>
                                            <span className="detail-label">Adresse:</span>{' '}
                                            <span className="detail-value">{venue.address}</span>
                                        </div>
                                        <div>
                                            <span className="detail-label">Stadt:</span>{' '}
                                            <span className="detail-value">{venue.city_name}</span>
                                        </div>
                                        <div className="website-field">
                                            <span className="detail-label">Website:</span>{' '}
                                            {venue.website && venue.website.trim() !== '' ? (
                                                <a
                                                    href={venue.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="artist-link"
                                                >
                                                    {venue.website}
                                                </a>
                                            ) : (
                                                <span className="no-link">— keine Website —</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {editingId !== venue.id && user?.hasDeletionPermission && (
                            <button
                                className="btn-edit"
                                style={{ marginLeft: 'auto', marginRight: '0.5rem' }}
                                onClick={() => setConfirmDeleteId(venue.id)}
                                title="Löschen"
                            >
                                🗑
                            </button>
                        )}

                        {confirmDeleteId === venue.id && user?.hasDeletionPermission && (
                            <div className="modal-overlay">
                                <div className="modal-box">
                                    <p>Möchtest du dieses Venue wirklich löschen?</p>
                                    <div className="modal-actions">
                                        <button
                                            className="btn btn-confirm"
                                            onClick={() => handleDelete(venue.id)}
                                        >
                                            Ja, löschen
                                        </button>
                                        <button
                                            className="btn btn-cancel"
                                            onClick={() => setConfirmDeleteId(null)}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}