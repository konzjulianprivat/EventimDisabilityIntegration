import React from "react";

const SmallEventCard = ({ image, title, link }) => {
    return (
        <div className="small-event-card">
            <img src={image} alt={title} className="small-event-image" />
            <div className="small-event-info">
                <h2 className="small-event-title">{title}</h2>
                <p> <a href={link} className="event-link">Siehe Mehr</a></p>
            </div>
        </div>
    );
};

const EventGrid = ({ events }) => {
    return (
        <div className="event-grid">
            {events.map((event, index) => (
                <SmallEventCard key={index} image={event.image} title={event.title} link={event.link} />
            ))}
        </div>
    );
};

export default EventGrid;
