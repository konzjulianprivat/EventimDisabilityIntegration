import React from "react";


const SmallArtistCard = ({ image, title, link }) => {
    return (
        <div className="small-tourCard-class">
            <img src={image} alt={title} className="small-tourCard-image" />
            <div className="small-tourCard-info">
                <h2 className="small-tourCard-title">{title}</h2>
                <p> <a href={link} className="small-tourCard-link">Siehe Mehr</a></p>
            </div>
        </div>
    );
};

const ArtistGrid = ({ artist }) => {
    return (
        <div className="small-tourCard-grid">
            {artist.map((artist, index) => (
                <SmallArtistCard key={index} image={artist.image} title={artist.title} link={artist.link}
                />
            ))}
        </div>
    );
};

export default ArtistGrid;




