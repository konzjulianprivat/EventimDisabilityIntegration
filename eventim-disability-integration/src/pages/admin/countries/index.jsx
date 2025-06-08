export default function ArtistsTooling() {

    const countrieLinks = [
        { label: 'Create', url: 'countries/create' },
        { label: 'Edit/Delete', url: 'countries/edit' },
    ];

    const citieLinks = [
        { label: 'Create', url: 'countries/cities/create' },
        { label: 'Edit/Delete', url: 'countries/cities/edit' },
    ];

    return (
        <div className="admin-tooling-wrapper">
            <div className="tooling-section">
                <h1 className="admin-heading">Admin-Country-Tooling</h1>
                <div className="button-row">
                    {countrieLinks.map((link, index) => (
                        <a key={index} href={link.url} className="admin-button" target="_blank"
                           rel="noopener noreferrer">
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="vertical-separator"></div>

            <div className="tooling-section">
                <h1 className="admin-heading">Admin-City-Tooling</h1>
                <div className="button-row">
                    {citieLinks.map((link, index) => (
                        <a key={index} href={link.url} className="admin-button" target="_blank"
                           rel="noopener noreferrer">
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React from 'react';