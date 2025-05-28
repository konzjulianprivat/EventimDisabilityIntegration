import React from "react";

const ImageScroller = ({ tour }) => {
    // Doppelte Liste zur Endlosschleife
    const loopedTournen = [...tour, ...tour];

    return (
        <div className="scroller-container">
            <div className="scroller">
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
                            className="scroller-img"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ImageScroller;
