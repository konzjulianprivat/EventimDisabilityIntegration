// components/smallArtistCard.jsx
"use client";

import React, { useState, useEffect } from "react";

const SmallArtistCard = ({ imageId, title, link }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchImage() {
            if (!imageId) return;
            try {
                const res = await fetch(`http://localhost:4000/image/${imageId}`);
                if (!res.ok) {
                    console.warn(`Artist-Bild ${imageId} nicht gefunden`);
                    return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                if (isMounted) setImageUrl(url);
            } catch (err) {
                console.error("Error fetching artist image:", err);
            }
        }
        fetchImage();
        return () => {
            isMounted = false;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [imageId]);

    return (
        <div className="small-tourCard-class">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="small-tourCard-image" />
            ) : (
                <div className="small-tourCard-image-placeholder" />
            )}
            <div className="small-tourCard-info">
                <h2 className="small-tourCard-title">{title}</h2>
                <p>
                    <a href={link} className="small-tourCard-link">
                        Siehe Mehr
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SmallArtistCard;