"use client";

import { useRouter } from 'next/router';

export default function BackLink() {
    const router = useRouter();
    return (
        <div className="back-link-container">
            <a onClick={() => router.back()} className="back-link">&larr; Zurück</a>
        </div>
    );
}
