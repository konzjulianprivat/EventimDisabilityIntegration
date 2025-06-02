export default function ArtistsTooling() {

    const links = [
        { label: 'Create', url: 'cities/create' },
        { label: 'Edit/Delete', url: 'cities/edit' },
    ];

    return (
        <div className="admin-container">
            <h1 className="admin-heading">Admin-City-Tooling</h1>

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