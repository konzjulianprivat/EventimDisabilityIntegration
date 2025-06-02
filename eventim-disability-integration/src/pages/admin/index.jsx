export default function AdminTooling() {

    const links = [
        { label: 'Artist', url: 'admin/artists' },
        { label: 'Cities', url: 'admin/cities' },
        { label: 'Countries', url: 'admin/countries' },
        { label: 'Genres', url: 'admin/genres' },
        { label: 'Tours/Events', url: 'admin/tours' },
        { label: 'Venues', url: 'admin/venues' },
    ];

    return (
        <div className="admin-container">
            <h1 className="admin-heading">Admin-Tooling</h1>

            <div className="button-row">
                {links.map((link, index) => (
                    <a key={index} href={link.url} className="admin-button" target="_blank" rel="noopener noreferrer">
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
}

import React from 'react';
