// src/pages/_app.jsx

import '../styles/global.css';
import '../styles/login.css';
import '../styles/AdminTooling.css';
import '../styles/profile.css';
import '../styles/squareTourCard.css';
import '../styles/filter-bar.css';
import '../styles/artists.css';
import '../styles/tours.css';
import '../styles/AS-Login.css';
import '../styles/footer.css';
import '../styles/scroller.css';
import '../styles/smallTourCard.css';
import '../styles/navBar.css';
import '../styles/search.css';
import '../styles/events.css';
import '../styles/checkout.css';
import '../styles/404.css';
import '../styles/loadingOverlay.css';

import NavBar from '../components/nav-bar.jsx';
import Footer from '../components/footer.jsx';
import Head from 'next/head';
import { CartProvider } from '../hooks/useCart';

import { useState, useEffect } from 'react';
import Router from 'next/router';
import LoadingOverlay from '../components/LoadingOverlay.jsx'; // ← new

export default function MyApp({ Component, pageProps }) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setIsLoading(true);
        const handleEnd   = () => setIsLoading(false);

        Router.events.on('routeChangeStart',  handleStart);
        Router.events.on('routeChangeComplete', handleEnd);
        Router.events.on('routeChangeError',    handleEnd);

        return () => {
            Router.events.off('routeChangeStart',  handleStart);
            Router.events.off('routeChangeComplete', handleEnd);
            Router.events.off('routeChangeError',    handleEnd);
        };
    }, []);

    return (
        <CartProvider>
            <Head>
                <link rel="icon" href="/pictures/favicon.png" />
                <title>Eventim</title>
            </Head>

            {isLoading && <LoadingOverlay />}   {/* ← displays during navigation */}

            <NavBar />
            <div className="page">
                <div className="content">
                    <Component {...pageProps} />
                </div>
                <Footer />
            </div>
        </CartProvider>
    );
}