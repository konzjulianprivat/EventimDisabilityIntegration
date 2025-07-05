// pages/404.jsx
import Link from 'next/link'

export default function Custom404() {
    return (
        <div className="custom404-wrapper">
            <div className="custom404-content">
                <h1 className="custom404-code">404</h1>
                <p className="custom404-message">
                    Oops! Die gesuchte Seite konnte nicht gefunden werden.
                </p>
                <Link href="/" className="custom404-button">
                    Zur Startseite
                </Link>
            </div>
        </div>
    )
}