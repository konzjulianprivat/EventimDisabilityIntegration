import React from "react";

const SmallTourCard = ({ image, title, link }) => {
    return (
        <div className="small-tour-card">
            <img src={image} alt={title} className="small-tour-image" />
            <div className="small-tour-info">
                <h2 className="small-tour-title">{title}</h2>
                <p> <a href={link} className="tour-link">Siehe Mehr</a></p>
            </div>
        </div>
    );
};

const TourGrid = ({ tour }) => {
    return (
        <div className="tour-grid">
            {tour.map((tour, index) => (
                <SmallTourCard key={index} image={tour.image} title={tour.title} link={tour.link} />
            ))}
        </div>
    );
};

export default TourGrid;
