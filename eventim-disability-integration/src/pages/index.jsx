import SmallTourCard from "../components/smallEventCard.jsx";
import ImageScroller from "../components/ImageScroller";

const tourData = [
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan", link: "https://www.google.com"},
    { image: "picture LINK/ID", title: "TourTitel" },
];

export default function MyApp() {
    return (
        <>
            <div className="homepage">
                <ImageScroller tour={tourData} />
                <div className="content">
                    <SmallTourCard tour={tourData} />
                </div>
            </div>
        </>
    );
}