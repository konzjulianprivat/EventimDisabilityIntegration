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

                const toursWithEvents = [];
                for (const t of body.tours) {
                    try {
                        const dRes = await fetch(`http://localhost:4000/tour-details/${t.id}`);
                        if (!dRes.ok) continue;
                        const dBody = await dRes.json();
                        if (dBody.tour && dBody.tour.eventCount > 0) {
                            toursWithEvents.push(t);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
                setTours(toursWithEvents);
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
                const artistIds = new Set(tours.map((t) => t.artist_id));
                const filtered = body.artists.filter((a) => artistIds.has(a.id));
                setArtists(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingArtists(false);
            }
        }
        if (!loadingTours) {
            fetchArtists();
        }
    }, [loadingTours, tours]);

    if (loadingTours || loadingArtists) {
        return <div>Lädt…</div>;
    }

    return (
        <div className="homepage">
            <ImageScroller
                tour={tours.map((t) => ({
                    imageId: t.tour_image,
                    title: t.title,
                    link: `/artists/${t.artist_id}/${t.id}`,
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
                            link={`/artists/${tour.artist_id}/${tour.id}`}
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
                            link={`/artists/${artist.id}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}