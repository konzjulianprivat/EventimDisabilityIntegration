// src/pages/_app.js
import '../styles/global.css';
import NavBar from '../components/nav-bar.jsx';

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            <NavBar />
            <div className="page">
                <div className="content">
                    <Component {...pageProps} />
                </div>
                <footer>
                    <div className="footer-content">
                        <p>© 2023 Eventim. All rights reserved.</p>
                        <p>Privacy Policy | Terms of Service Change Noah</p>
                    </div>
                </footer>
            </div>
        </>
    );
}