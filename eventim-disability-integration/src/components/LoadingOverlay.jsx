// src/components/LoadingOverlay.jsx

import React from 'react';

export default function LoadingOverlay() {
    return (
        <div className="loading-overlay">
            <div className="spinner" />
            <p>Lädt…</p>
        </div>
    );
}
