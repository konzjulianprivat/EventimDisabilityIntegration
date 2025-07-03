// components/ImageScroller.jsx
"use client";

import React, { useState, useEffect } from "react";

const ImageScroller = ({ tour }) => {
    // `tour` ist ein Array von { imageId, title, link }
    // Nur zweimal fuer Endlosschleife noetig
    const loopedTours = [...tour, ...tour];

    // Hier speichern wir die gemappten Object-URLs
    const [urls, setUrls] = useState({}); // { [imageId]: objectURL }
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchAll() {
            for (const t of tour) {
                if (!t.imageId || urls[t.imageId]) continue;
                try {
                    const res = await fetch(`http://localhost:4000/image/${t.imageId}`);
                    if (!res.ok) continue;
                    const blob = await res.blob();
                    const objUrl = URL.createObjectURL(blob);
                    if (isMounted) {
                        setUrls((prev) => ({ ...prev, [t.imageId]: objUrl }));
                    }
                } catch (err) {
                    console.error("Error fetching scroller image:", err);
                }
            }
        }

        fetchAll().then(() => {
            if (isMounted) setReady(true);
        });
        return () => {
            isMounted = false;
            // Cleanup: revoke all object URLs
            Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
        };
    }, [tour]);

    return (
        <div className="homepage-scroller-container">
            <div
                className="homepage-scroller"
                style={{
                    "--scroll-duration": `${tour.length * 5}s`,
                    animationPlayState: ready ? "running" : "paused",
                }}
            >
                {loopedTours.map((t, idx) => {
                    const imgUrl = urls[t.imageId] || null;
                    return (
                        <a
                            href={t.link || "#"}
                            key={idx}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {imgUrl ? (
                                <img
                                    src={imgUrl}
                                    alt={t.title || `img-${idx}`}
                                    className="homepage-scroller-img"
                                />
                            ) : (
                                <div className="homepage-scroller-img-placeholder" />
                            )}
                        </a>
                    );
                })}
            </div>
        </div>
    );
};

export default ImageScroller;
