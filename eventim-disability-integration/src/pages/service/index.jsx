import React from 'react';
import { useRequireAccess } from '../../hooks/useRequireAccess';

export default function ServiceHome() {
    useRequireAccess(['hasDisabilityApprovalAccess']);

    const links = [
        { label: 'Ausgleichsanträge', url: '/service/compensation-for-disadvantages-requests' },
        { label: 'Account-Management', url: '/service/account-management' }
    ];

    return (
        <div className="profile-container" style={{ flexDirection: 'column' }}>
            <div className="content-inner" style={{ paddingTop: '24px' }}>
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <h1 className="events-header">Service Übersicht</h1>
                        <div className="profile-section-divider" />
                        <div className="tile-grid">
                            {links.map(link => (
                                <a key={link.url} href={link.url} className="tile-link">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
