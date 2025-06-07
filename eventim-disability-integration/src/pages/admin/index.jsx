import React from 'react';

export default function AdminTooling() {
    const links = [
        { label: 'Artist', url: 'admin/artists' },
        { label: 'Countries', url: 'admin/countries' },
        { label: 'Cities', url: 'admin/cities' },
        { label: 'Genres', url: 'admin/genres' },
        { label: 'Tours', url: 'admin/tours' },
        { label: 'Events', url: 'admin/events' },
        { label: 'Venues', url: 'admin/venues' },
        { label: 'User-Accounts', url: 'admin/accounts/userAccounts' },
        { label: 'Service-Accounts', url: 'admin/accounts/serviceAccounts' },
        { label: 'Admin-Accounts', url: 'admin/accounts/admin-accounts' },
    ];

    const firstLinks = links.slice(0, 7);
    const secondLinks = links.slice(7);

    return (
        <div className="admin-container">
            <h1 className="admin-heading">Admin-Tooling</h1>

            <div className="button-row">
                {firstLinks.map((link, index) => (
                    <a
                        key={index}
                        href={link.url}
                        className="admin-button"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {link.label}
                    </a>
                ))}
            </div>

            <div className="horizontal-separator"></div>

            <h1 className="admin-heading">Accounts-Tooling</h1>

            <div className="button-row">
                {secondLinks.map((link, index) => (
                    <a
                        key={index}
                        href={link.url}
                        className="admin-button"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
}
