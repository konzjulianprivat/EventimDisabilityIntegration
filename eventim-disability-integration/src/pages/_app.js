// pages/_app.js
import '../styles/global.css';
import '../styles/login.css';
import '../styles/AdminTooling.css';
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
