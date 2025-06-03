// pages/index.jsx
"use client";

import React, { useState, useEffect } from "react";
import SmallTourCard from "../components/smallTourCard.jsx";
import SmallArtistCard from "../components/smallArtistCard.jsx";
import ImageScroller from "../components/ImageScroller.jsx";

export default function HomePage() {
    const [tours, setTours] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loadingTours, setLoadingTours] = useState(true);
    const [loadingArtists, setLoadingArtists] = useState(true);

    useEffect(() => {
        async function fetchTours() {
            try {
                const res = await fetch("http://localhost:4000/tours-with-images");
                if (!res.ok) throw new Error("Failed to load tours");
                const body = await res.json();
                setTours(body.tours);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingTours(false);
            }
        }
        fetchTours();
    }, []);

    useEffect(() => {
        async function fetchArtists() {
            try {
                const res = await fetch("http://localhost:4000/artists-with-images");
                if (!res.ok) throw new Error("Failed to load artists");
                const body = await res.json();
                setArtists(body.artists);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingArtists(false);
            }
        }
        fetchArtists();
    }, []);

    if (loadingTours || loadingArtists) {
        return <div>Lädt…</div>;
    }

    return (
        <div className="homepage">
            <ImageScroller
                tour={tours.map((t) => ({
                    imageId: t.tour_image,
                    title: t.title,
                    link: `/tour/${t.id}`,
                }))}
            />

            <div className="highlights-section">
                <h2>Highlights</h2>
                <div className="small-tourCard-grid">
                    {tours.map((tour) => (
                        <SmallTourCard
                            key={tour.id}
                            imageId={tour.tour_image}
                            title={tour.title}
                            link={`/tour/${tour.id}`}
                        />
                    ))}
                </div>
            </div>

            <div className="artists-section">
                <h2>Künstler</h2>
                <div className="small-tourCard-grid">
                    {artists.map((artist) => (
                        <SmallArtistCard
                            key={artist.id}
                            imageId={artist.artist_image}
                            title={artist.name}
                            link={`/artist/${artist.id}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}