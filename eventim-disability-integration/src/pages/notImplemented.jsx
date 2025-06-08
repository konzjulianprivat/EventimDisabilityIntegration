import React from 'react';

export default function Error501Page() {
    return (
        <div className="error-container">
            <div className="error-box">
                <h1 className="error-code">501</h1>
                <h2 className="error-title">Nicht implementiert</h2>
                <p className="error-message">
                    Die angeforderte Funktion ist derzeit nicht verfügbar oder wurde noch nicht implementiert.
                </p>
            </div>
        </div>
    );
}
