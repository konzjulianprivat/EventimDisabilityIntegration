import '../styles/global.css';
import '../styles/login.css';
import '../styles/AdminTooling.css';
import '../styles/profile.css';
import '../styles/squareTourCard.css';
import '../styles/filter-bar.css';
import '../styles/artists.css';
import '../styles/tours.css';
import '../styles/AS-Login.css';
import '../styles/tourDetailsPage.css';
import '../styles/footer.css';
import '../styles/scroller.css';
import '../styles/smallTourCard.css';
import '../styles/navBar.css';
import '../styles/events.css';

import NavBar from '../components/nav-bar.jsx';
import Footer from '../components/footer.jsx';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <link rel="icon" href="/pictures/favicon.png" />
                <title>Eventim</title>
            </Head>
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
