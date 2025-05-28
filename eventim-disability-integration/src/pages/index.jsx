// pages/index.jsx
import Link from 'next/link';
import NavBar from '../components/nav-bar';

export default function Home() {
    const pages = [
        { href: '/', label: 'Homepage' },
        { href: '/devtesting', label: 'Dev Testing' },
        { href: '/registration', label: 'Registration' },
    ];

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Homepage</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {pages.map(({ href, label }) => (
                    <li key={href} style={{ margin: '0.5rem 0' }}>
                        <Link href={href} style={{ textDecoration: 'none', color: '#0070f3' }}>
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
