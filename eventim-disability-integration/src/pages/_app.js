import '../styles/global.css';
import '../styles/login.css';
import NavBar from '../components/nav-bar.jsx';
import Footer from "../components/footer.jsx";


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