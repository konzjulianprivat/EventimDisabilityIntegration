import React from 'react';

export default function ArtistsTooling() {

    const tourLinks = [
        { label: 'Create', url: 'tours/create' },
        { label: 'Edit/Delete', url: 'tours/edit' },
    ];

    const eventLinks = [
        { label: 'Create', url: 'tours/events/create' },
        { label: 'Edit/Delete', url: 'tours/events/edit' },
    ];

    return (
        <div className="admin-tooling-wrapper">
            <div className="tooling-section">
                <h1 className="admin-heading">Admin-Tours-Tooling</h1>
                <div className="button-row">
                    {tourLinks.map((link, index) => (
                        <a key={index} href={link.url} className="admin-button" target="_blank" rel="noopener noreferrer">
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="vertical-separator"></div>

            <div className="tooling-section">
                <h1 className="admin-heading">Admin-Events-Tooling</h1>
                <div className="button-row">
                    {eventLinks.map((link, index) => (
                        <a key={index} href={link.url} className="admin-button" target="_blank" rel="noopener noreferrer">
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
