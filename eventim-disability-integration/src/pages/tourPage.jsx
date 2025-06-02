import React from 'react';

const tourData = {
    title: 'TourName',
    dateRange: '12.01.2026 – 14.01.2026',
    ticketInfo: 'Tickets ab € 54,00',
    image: '/pictures/TestPictures/Test-Picture-EventCard.jpg',
};

const eventData = [
    {
        date: 'Date',
        month: 'Month, ',
        year: 'Year',
        weekday: 'Day,',
        time: 'Time',
        available: true,
        price: 54,
        location: 'Location',
        venue: 'Name of Location',
    },
    {
        date: '14',
        month: 'Jan.',
        year: '2026',
        weekday: 'Mi.',
        time: '20:00',
        available: false,
        price: 15,
        location: 'HAMBURG',
        venue: 'Barclays Arena',
    },
    {
        date: '14',
        month: 'Jan.',
        year: '2026',
        weekday: 'Mi.',
        time: '20:00',
        available: true,
        price: 80.50,
        location: 'HAMBURG',
        venue: 'Barclays Arena',
    },
];

const EventCard = ({ event, title }) => (
    <div className="tourPage-event-card">
        <div className="tourPage-event-date">
            <span className="date">{event.date}</span>
            <span className="month-year">{event.month} {event.year}</span>
            <span className="weekday">{event.weekday} {event.time}</span>
        </div>
        <div className="tourPage-event-details">
            <h3>{title}</h3>
            <p>{event.location}</p>
            <p>{event.venue}</p>
        </div>
        <div className="tourPage-event-actions">
            {event.available ? (
                <>
                    <span className="tourPage-price">ab € {event.price}</span>
                    <button className="btn btn-blue">Weiter</button>
                </>
            ) : (
                <>
                    <span className="tourPage-not-available">zur Zeit nicht verfügbar</span>
                    <button className="btn btn-outline">Infos anzeigen</button>
                </>
            )}
        </div>
    </div>
);

const WinterConcerts = () => {
    return (
        <div className="tour-page-container">
            <div className="tour-page-header-flex">
                <div className="tour-header-text">
                    <h1>{tourData.title}</h1>
                    <p>{tourData.dateRange} | {eventData.length} Events</p>
                    <p>{tourData.ticketInfo}</p>
                </div>
                <div className="tour-header-image">
                    <img src={tourData.image} alt="TourImage-false" />
                </div>
            </div>

            <div className="events-list">
                {eventData.map((event, index) => (
                    <EventCard event={event} title={tourData.title} />
                ))}
            </div>
        </div>
    );
};

export default WinterConcerts;