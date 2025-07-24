// components/squareTourCard.jsx
"use client";

import React, { useState, useEffect } from "react";

const SquareTourCard = ({ imageId, title, bottomText, link }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const placeholderImage = "/pictures/placeholder.png";

    useEffect(() => {
        let isMounted = true;

        async function fetchImage() {
            if (!imageId) return;
            try {
                const res = await fetch(`http://localhost:4000/images/${imageId}`);
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
                <img
                    src={imageUrl || placeholderImage}
                    alt={title}
                    className="square-tourCard-image"
                />
            </div>

            <div className="square-tourCard-info">
                <h2 className="square-tourCard-title">{title}</h2>
                <p className="square-tourCard-price">
                    <a href={link} className="square-tourCard-link">
                        {bottomText}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SquareTourCard;
