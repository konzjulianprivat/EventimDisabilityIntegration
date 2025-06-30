import React from 'react';

export default function AdminHome() {
    const entities = [
        { name: 'Artists', url: '/admin/artists' },
        { name: 'Countries', url: '/admin/countries' },
        { name: 'Cities', url: '/admin/cities' },
        { name: 'Genres', url: '/admin/genres' },
        { name: 'Tours', url: '/admin/tours' },
        { name: 'Venues', url: '/admin/venues' },
        { name: 'Areas', url: '/admin/venues/areas' }
    ];

    return (
        <div className="profile-container" style={{ flexDirection: 'column' }}>
            <div className="content-inner" style={{ paddingTop: '24px' }}>
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <h1 className="events-header" style={{color: "#002b55"}}>Admin Übersicht</h1>
                        <p className="subtitle">Übersicht aller ADMIN-Applikationen und Übersichten.</p>
                        <div className="profile-section-divider" />
                        <div className="tile-grid">
                            {entities.map(e => (
                                <a key={e.url} href={e.url} className="tile-link">
                                    {e.name} verwalten
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
