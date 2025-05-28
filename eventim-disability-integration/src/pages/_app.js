// src/pages/_app.js
import '../styles/global.css';
import NavBar from '../components/nav-bar.jsx';
import Footer from "../components/footer";

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            <NavBar />
            <div className="page">
                <div className="content">
                    <Component {...pageProps} />
                </div>
                <Footer />
            </div>
        </>
    );
}