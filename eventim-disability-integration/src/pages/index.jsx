import SmallEventCard from "../components/smallEventCard.jsx";
import ImageScroller from "../components/ImageScroller";

const eventData = [
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan", link: "https://www.google.com"},
    { image: "/pictures/TestPictures/Test-Picture-EventCard2.jpg", title: "Lisa Eckhart" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard2.jpg", title: "Lisa Eckhart" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard2.jpg", title: "Lisa Eckhart" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard2.jpg", title: "Lisa Eckhart" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard.jpg", title: "Teddy Teclebrhan" },
    { image: "/pictures/TestPictures/Test-Picture-EventCard2.jpg", title: "Lisa Eckhart" },
];

export default function MyApp() {
    return (
        <>
            <div className="homepage">
                <ImageScroller events={eventData} />
                <div className="content">
                    <SmallEventCard events={eventData} />
                </div>
            </div>
        </>
    );
}