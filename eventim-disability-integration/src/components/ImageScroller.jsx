import React from "react";

const ImageScroller = ({ events }) => {
    return (
        <div className="scroller-container">
            <div className="scroller">
                {events.map((event, index) => (
                    <a
                        href={event.link || "#"}
                        key={index}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={event.image}
                            alt={event.title || `img-${index}`}
                            className="scroller-img"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ImageScroller;