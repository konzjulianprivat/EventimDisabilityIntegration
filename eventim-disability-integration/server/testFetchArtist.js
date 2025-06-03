
(async () => {
    try {
        const response = await fetch('http://localhost:4000/artists');
        if (!response.ok) {
            throw new Error(`Server-Antwort nicht OK (Status ${response.status})`);
        }

        const json = await response.json();
        console.log('=== API-Roh-Antwort ===');
        console.log(JSON.stringify(json, null, 2));

        let artistsArray;
        if (Array.isArray(json)) {
            artistsArray = json;
        } else if (json.artists && Array.isArray(json.artists)) {
            artistsArray = json.artists;
        } else {
            artistsArray = [];
            console.warn('Konnte weder json noch json.artists als Array erkennen.');
        }

        console.log('\n=== Extrahiertes artists-Array ===');
        console.log(JSON.stringify(artistsArray, null, 2));

        artistsArray.forEach((artist, index) => {
            console.log(`\n-- Artist [${index}] --`);
            console.log(`ID        : ${artist.id}`);
            console.log(`Name      : ${artist.name}`);
            console.log(`Biografie : ${artist.biography}`);
            console.log(`Website   : ${artist.website}`);
            console.log(`Bild-URL  : ${artist.artist_image}`);
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Künstler:', err);
    }
})();
