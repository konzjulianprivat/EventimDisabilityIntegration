export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-grid">
                <div>
                    <h3 className="footer-heading">EVENTIM</h3>
                    <ul className="footer-links">
                        <li><a href="https://www.eventim.de/campaign/international/" className="link-clean">EVENTIM International</a></li>
                        <li><a href="https://www.eventim.de/help/terms/" className="link-clean">AGB</a></li>
                        <li><a href="https://www.eventim.de/help/data-protection/" className="link-clean">Datenschutz</a></li>
                        <li><a href="https://www.eventim.de/#cmpbox" className="link-clean">Cookie-Einstellungen</a></li>
                        <li><a href="https://www.eventim.de/help/imprint/" className="link-clean">Impressum</a></li>
                        <li><a href="https://www.eventim.de/help/imprint/" className="link-clean">Widerruf</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="footer-heading">Das Unternehmen</h3>
                    <ul className="footer-links">
                        <li><a href="https://corporate.eventim.de/" className="link-clean">Corporate Website</a></li>
                        <li><a href="https://karriere.eventim.de/" className="link-clean">Jobs & Karriere</a></li>
                        <li><a href="/admin/login" className="link-clean">Admin-Login</a></li>
                        <li><a href="/service/login" className="link-clean">Service-Login</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="footer-heading">B2B</h3>
                    <ul className="footer-links">
                        <li><a href="https://www.eventim.de/campaign/veranstalter/ticketingsysteme/kontakt/" className="link-clean">Kontakt</a></li>
                        <li><a href="https://www.eventim.de/campaign/veranstalter/ticketingsysteme/" className="link-clean">Veranstalter</a></li>
                        <li><a href="https://www.eventim-business.de/produktwelt/eventimsales/" className="link-clean">Vorverkaufspartner</a></li>
                        <li><a href="https://eventim-brand-connect.com//" className="link-clean">Media & Sponsoring</a></li>
                        <li><a href="https://www.eventim.de/campaign/eventim-partner/" className="link-clean">Affiliate Partner</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="footer-heading">Hilfe & Service</h3>
                    <ul className="footer-links">
                        <li><a href="https://www.eventim.de/helpcenter/" className="link-clean">Help Center / FAQ</a></li>
                        <li><a href="https://www.eventim.de/campaign/eventim-news/" className="link-clean">EVENTIM-News</a></li>
                        <li><a href="https://www.eventim.de/help/outlets/" className="link-clean">Vorverkaufsstellen</a></li>
                        <li><a href="https://www.eventim.de/campaign/gutschein/" className="link-clean">EVENTIM-Gutschein</a></li>
                        <li><a href="https://www.eventim.de/help/updates/" className="link-clean">Absagen & Verlegungen</a></li>
                        <li><a href="https://www.eventim.de/campaign/eventim-groupBooking/" className="link-clean">Gruppenbuchungen</a></li>
                        <li><a href="https://www.eventim.de/campaign/dsa-report/" className="link-clean">Meldung nach Art. 16 DSA</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="footer-heading">Mehr EVENTIM</h3>
                    <ul className="footer-links">
                        <li><a href="https://www.eventim.de/campaign/eventim-app/" className="link-clean">EVENTIM.App</a></li>
                        <li><a href="https://www.eventim.de/campaign/pass/" className="link-clean">EVENTIM.Pass</a></li>
                        <li><a href="https://www.eventim.de/magazin/" className="link-clean">EVENTIM Headliner</a></li>
                        <li><a href="https://www.eventim.de/campaign/eventimcard/" className="link-clean">eventimcard</a></li>
                        <li><a href="https://www.fansale.de/fansale/" className="link-clean">fanSales</a></li>
                        <li><a href="https://www.eventim-travel.de/?utm_source=eventim&utm_medium=dp&utm_campaign=homepage&utm_content=footer" className="link-clean">EVENTIM.Travel</a></li>
                        <li><a href="https://www.waldbuehne-berlin.de/" className="link-clean">Waldbühne Berlin</a></li>
                    </ul>
                </div>
                <div>
                <h3 className="footer-heading">Musicals</h3>
                    <ul className="footer-links">
                        {/* No Musicals listed yet. This section may be populated in the future. */}
                        <li>No Musicals listed yet</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-social">
                    <div className="footer-label">Social Links</div>
                    <div className="footer-icons-logo">
                        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"
                           className="picture-link-clean">
                            <img src="/pictures/facebook-logo.png" alt="Facebook" className="footer-img"/>
                        </a>
                        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"
                           className="picture-link-clean">
                            <img src="/pictures/instagram-logo.png" alt="Instagram" className="footer-img"/>
                        </a>
                        <a href="https://www.x.com" target="_blank" rel="noopener noreferrer"
                           className="picture-link-clean">
                            <img src="/pictures/x-logo.png" alt="X" className="footer-img"/>
                        </a>
                    </div>
                </div>
                <div className="footer-apps">
                    <div className="footer-label">App Download</div>
                    <div className="footer-icons-badges">
                        <a href="https://apps.apple.com/de/app/eventim-de/id408601891" target="_blank"
                           rel="noopener noreferrer">
                            <img src="/pictures/apple-store-badge.svg" alt="App Store" className="footer-img"/>
                        </a>
                        <a href="https://play.google.com/store/apps/details?id=de.eventim.mobile.app.Android&hl=en" target="_blank" rel="noopener noreferrer">
                            <img src="/pictures/google-play-badge.png" alt="Google Play" className="footer-img"/>
                        </a>
                    </div>
                </div>
                <div className="footer-hotline">
                    <p className="footer-hotline-title">Bestell-Hotline Mo-Sa von 09:00 Uhr bis 18:00 Uhr</p>
                    <a href="tel:01806570070" className="footer-hotline-number">01806-570070</a>
                    <p className="footer-hotline-subtext">(0,20 €/Anruf inkl. MwSt aus allen dt. Netzen)</p>
                </div>
            </div>
        </footer>
    );
}
