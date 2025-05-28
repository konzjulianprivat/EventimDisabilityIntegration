import React from "react";

const SmallTourCard = ({ image, title, link }) => {
    return (
        <div className="small-tourCard-class">
            <img src={image} alt={title} className="small-tourCard-image" />
            <div className="small-tour-info">
                <h2 className="small-tourCard-title">{title}</h2>
                <p> <a href={link} className="small-tourCard-link">Siehe Mehr</a></p>
            </div>
        </div>
    );
};

const TourGrid = ({ tour }) => {
    return (
        <div className="small-tourCard-grid">
            {tour.map((tour, index) => (
                <SmallTourCard key={index} image={tour.image} title={tour.title} link={tour.link} />
            ))}
        </div>
    );
};

export default TourGrid;
