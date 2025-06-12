import React from 'react';

export default function AdminTooling() {
    const links = [
        { label: 'Disability Functions', url: 'service/disabilityFunction' },
        { label: 'Bookings', url: 'service/bookings' },
        { label: 'User-Accounts', url: 'service/userAccounts' },
        { label: 'Service-Accounts', url: 'service/serviceAccounts' },
    ];

    const firstLinks = links.slice(0, 2);
    const secondLinks = links.slice(2);

    return (
        <div className="admin-container">
            <h1 className="admin-heading">Service-Tooling</h1>

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
