// components/squareTourCard.jsx
"use client";

import React, { useState, useEffect } from "react";

/**
 * Props:
 * - imageId:    UUID der Tour-Bilddatei in der Datenbank
 * - title:      String, z.B. "Rod Stewart"
 * - priceText:  String, z.B. "Tickets ab € 68,00"
 * - link:       URL, auf die beim Klick auf Titel/Preis navigiert wird
 */
const SquareTourCard = ({ imageId, title, priceText, link }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchImage() {
            if (!imageId) return;
            try {
                const res = await fetch(`http://localhost:4000/image/${imageId}`);
                if (!res.ok) {
                    console.warn(`Tour-Bild ${imageId} nicht gefunden`);
                    return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                if (isMounted) setImageUrl(url);
            } catch (err) {
                console.error("Error fetching tour image:", err);
            }
        }

        fetchImage();

        return () => {
            isMounted = false;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageId]);

    return (
        <div className="square-tourCard-class">
            <div className="square-tourCard-image-wrapper">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="square-tourCard-image"
                    />
                ) : (
                    <div className="square-tourCard-image-placeholder" />
                )}
            </div>

            <div className="square-tourCard-info">
                <h2 className="square-tourCard-title">{title}</h2>
                <p className="square-tourCard-price">
                    <a href={link} className="square-tourCard-link">
                        {priceText}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SquareTourCard;
