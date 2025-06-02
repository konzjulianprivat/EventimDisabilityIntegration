import ImageScroller from "../components/ImageScroller.jsx";
import SmallTourCard from "../components/smallEventCard.jsx";
import SmallArtistCard from "../components/smallArtistCard.jsx";

const tourData = [
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg",
        title: "Teddy Teclebrhan Tour",
        link: "/tourPage"},

    { image: "picture-artist LINK",
        title: "TourTitel" },
];

const artistData = [
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg",
        title: "Teddy Teclebrhan",
        link: "https://www.google.com" },

    { image: "pincture-artist LINK/ID",
        title: "Künstler 2"},

];

export default function MyApp() {
    return (
        <>
            <div className="homepage">
                <ImageScroller tour={tourData}/>

                <div className="highlights-section">
                    <h2>Highlights</h2>
                    <div className="small-tourCard-grid">
                        <SmallTourCard tour={tourData}/>
                    </div>
                </div>


                <div className="artists-section">
                    <h2>Künstler</h2>
                    <div className="small-tourCard-grid">
                        <SmallArtistCard artist={artistData}/>
                    </div>
                </div>
            </div>
        </>
    );
}
