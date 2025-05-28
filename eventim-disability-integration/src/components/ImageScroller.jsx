import React from "react";

const ImageScroller = ({ tour }) => {
    // Doppelte Liste zur Endlosschleife
    const loopedTournen = [...tour, ...tour];

    return (
        <div className="homepage-scroller-container">
            <div className="homepage-scroller">
                {loopedTournen.map((tour, index) => (
                    <a
                        href={tour.link || "#"}
                        key={index}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={tour.image}
                            alt={tour.title || `img-${index}`}
                            className="homepage-scroller-img"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ImageScroller;
