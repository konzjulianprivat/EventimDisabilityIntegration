const express = require('express');
const cors = require('cors');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve /uploads as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use memory storage for multer to get a Buffer for DB
const upload = multer({ storage: multer.memoryStorage() });
app.post('/upload-image', upload.single('image'), async (req, res) => {
    const id = Number(req.body.id);
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    try {
        await client.query(
            'INSERT INTO images (id, image_data, image_type) VALUES ($1, $2, $3)',
            [id, imageBuffer, mimeType]
        );
        res.status(200).send('Image uploaded!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Upload failed');
    }
});

app.get('/image/:id', async (req, res) => {
    try {
        const { rows } = await client.query(
            'SELECT image_data, image_type FROM images WHERE id = $1',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).send('Not found');
        res.set('Content-Type', rows[0].image_type);
        res.send(rows[0].image_data);
    } catch (err) {
        res.status(500).send('Error retrieving image');
    }
});

app.post('/register-user', upload.single('disabilityCardImage'), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            birthDate,
            phone,
            disabilityCheck,
            disabilityDegree,
            streetAddress,
            city,
            postalCode,
            country,
            company,
            salutation,
        } = req.body;

        // Pflichtfelder prüfen
        if (!email || !password || !firstName || !lastName) {
            return res
                .status(400)
                .json({ message: 'Vorname, Nachname, E-Mail und Passwort sind erforderlich.' });
        }

        // Prüfen, ob E-Mail schon existiert
        const userCheck = await client.query('SELECT user_id FROM users WHERE email = $1', [
            email.trim(),
        ]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'E-Mail ist bereits registriert.' });
        }

        // Neues user_id generieren
        const userId = uuidv4();

        // Hashen des Passworts
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds);
        console.log('DEBUG: plain=', password, 'hash=', hashedPass);

        // Datei‐Upload verarbeiten (falls vorhanden)
        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                `INSERT INTO images (id, image_data, image_type, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [imageId, req.file.buffer, req.file.mimetype, 'user', userId]
            );
        }

        // Benutzer in users‐Tabelle einfügen
        const result = await client.query(
            `
                INSERT INTO users (
                    user_id,
                    first_name,
                    last_name,
                    email,
                    password,
                    birth_date,
                    phone,
                    disability_check,
                    disability_degree,
                    street_address,
                    city,
                    postal_code,
                    country,
                    company,
                    salutation,
                    disability_card_image,
                    created_at,
                    updated_at
                ) VALUES (
                             $1, $2, $3, $4, $5, $6, $7, $8, $9,
                             $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
                         ) RETURNING *;
            `,
            [
                userId,
                firstName.trim(),
                lastName.trim(),
                email.trim(),
                hashedPass,             // <<< hier auf jeden Fall der Hash, nicht password
                birthDate || null,
                phone || null,
                disabilityCheck === 'true',
                disabilityDegree || null,
                streetAddress.trim(),
                city.trim(),
                postalCode.trim(),
                country?.trim() || 'Deutschland',
                company?.trim() || null,
                salutation?.trim() || null,
                imageId,
            ]
        );

        // Passwort‐Feld nicht zurücksenden
        const newUser = result.rows[0];
        delete newUser.password;

        return res.status(201).json({
            message: 'Registrierung erfolgreich',
            user: newUser,
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Serverfehler während der Registrierung' });
    }
});

app.post('/login-user', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Pflichtfeld‐Prüfung
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'E-Mail und Passwort sind erforderlich.' });
        }

        // 2) Nutzer mit gegebener E-Mail abrufen
        const result = await client.query(
            `
      SELECT
        user_id,
        email,
        password,            -- bcrypt-Hash
        first_name,
        last_name,
        salutation,
        company,
        street_address,
        postal_code,
        city,
        country,
        phone,
        birth_date,
        disability_check,
        disability_degree,
        disability_card_image,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
            [email.trim()]
        );

        if (result.rows.length === 0) {
            // Kein Nutzer mit dieser E-Mail gefunden
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        const user = result.rows[0];

        // 3) Passwort vergleichen (bcrypt.compare)
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // 4) Login erfolgreich → sichere Nutzerdaten zurückgeben (ohne password)
        const safeUser = { ...user };
        delete safeUser.password;

        return res.status(200).json({
            message: 'Login erfolgreich',
            user: safeUser,
            // OPTIONAL: hier könntest du direkt ein JWT signen und mit zurückschicken
            // token: '…'
        });
    } catch (err) {
        console.error('Login‐Fehler:', err);
        return res
            .status(500)
            .json({ message: 'Serverfehler beim Einloggen.' });
    }
});
app.post('/create-country', async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name ist erforderlich' });
        }
        const countryId = uuidv4();

        const insertQuery = code
            ? 'INSERT INTO countries (id, name, iso_code) VALUES ($1, $2, $3) RETURNING id, name, iso_code;'
            : 'INSERT INTO countries (id, name) VALUES ($1, $2) RETURNING id, name;';

        const params = code
            ? [countryId, name.trim(), code.trim().toUpperCase()]
            : [countryId, name.trim()];

        const result = await client.query(insertQuery, params);
        const country = result.rows[0];

        res.status(201).json({ message: 'Land erstellt', country });
    } catch (error) {
        console.error('Create-country error:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Landes' });
    }
});

app.get('/countries', async (req, res) => {
    try {
        const result = await client.query('SELECT id, name FROM countries ORDER BY name');
        res.status(200).json({ countries: result.rows });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Fehler beim Laden der Länder' });
    }
});
app.post('/create-artist', upload.single('artistImage'), async (req, res) => {
    try {
        const { name, biography, website } = req.body;

        const artistId = uuidv4();
        let imageId = null;

        if (req.file) {
            imageId = uuidv4();
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
                [imageId, req.file.buffer, req.file.mimetype, 'artist', artistId]
            );
        }

        const result = await client.query(
            `INSERT INTO artists (id, name, biography, website, artist_image)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [artistId, name.trim(), biography || null, website || null, imageId]
        );

        const artist = result.rows[0];
        res.status(201).json({ message: 'Artist created', artist });
    } catch (error) {
        console.error('Create-artist error:', error);
        res.status(500).json({ message: 'Server error during artist creation' });
    }
});
app.get('/artists', async (req, res) => {
    try {
        const result = await client.query('SELECT id, name FROM artists ORDER BY name');
        res.json({ artists: result.rows });
    } catch (err) {
        console.error('Error fetching artists:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Künstler' });
    }
});

app.get('/genres', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, name FROM genres ORDER BY name'
        );
        res.json({ genres: result.rows });
    } catch (err) {
        console.error('Error fetching genres:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Genres' });
    }
});

// -------------------------------------------------------------
// 2) GET /subgenres?genreId=<UUID>  → liefert nur Subgenres für ein bestimmtes Genre
// -------------------------------------------------------------
app.get('/subgenres', async (req, res) => {
    const { genreId } = req.query;
    if (!genreId) {
        return res
            .status(400)
            .json({ message: 'genreId als Query-Parameter ist erforderlich' });
    }

    try {
        const result = await client.query(
            `SELECT id, name, genre_id 
         FROM subgenres 
        WHERE genre_id = $1 
     ORDER BY name`,
            [genreId]
        );
        res.json({ subgenres: result.rows });
    } catch (err) {
        console.error('Error fetching subgenres:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Subgenres' });
    }
});
app.post('/create-tour', upload.single('tourImage'), async (req, res) => {
    // Aus dem multipart/form-data-Body:
    const {
        title,
        description,
        startDate,
        endDate,
        artistId,
        genres: genresJson,
    } = req.body;

    // 3.1 Pflichtfelder prüfen
    if (!title || !startDate || !endDate || !artistId) {
        return res.status(400).json({
            message: 'Titel, Startdatum, Enddatum und Künstler sind erforderlich',
        });
    }

    // 3.2 tourGenres parsen (Array von { genreId, subgenreIds: [...] })
    let tourGenres = [];
    if (genresJson) {
        try {
            tourGenres = JSON.parse(genresJson);
        } catch {
            return res
                .status(400)
                .json({ message: 'Ungültiges Format für genres/subgenres' });
        }
    }

    // 3.3 Validierung der Genre-/Subgenre-Struktur
    for (let i = 0; i < tourGenres.length; i++) {
        const { genreId, subgenreIds } = tourGenres[i] || {};
        if (!genreId) {
            return res
                .status(400)
                .json({ message: `Genre ${i + 1} muss ausgewählt werden` });
        }
        if (!Array.isArray(subgenreIds) || subgenreIds.length === 0) {
            return res.status(400).json({
                message: `Für Genre ${i + 1} muss mindestens ein Subgenre angegeben sein`,
            });
        }
        for (let j = 0; j < subgenreIds.length; j++) {
            if (!subgenreIds[j]) {
                return res.status(400).json({
                    message: `Subgenre ${j + 1} in Genre-Block ${i + 1} ist erforderlich`,
                });
            }
            // Optional: Hier könnten Sie noch per SELECT prüfen,
            // ob subgenreIds[j] tatsächlich zu genreId gehört.
        }
    }

    try {
        await client.query('BEGIN');

        // 3.4 Tour-ID generieren
        const tourId = uuidv4();

        // 3.5 Bild speichern (falls vorhanden) – mit tourId als entity_id
        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                `
        INSERT INTO images
          (id, image_data, image_type, entity_type, entity_id)
        VALUES ($1, $2, $3, $4, $5)
        `,
                [
                    imageId,
                    req.file.buffer,
                    req.file.mimetype,
                    'tour',
                    tourId, // sofort auf die neue Tour verweisen
                ]
            );
        }

        // 3.6 Tour-Datensatz speichern
        const {
            rows: [createdTour],
        } = await client.query(
            `
                INSERT INTO tours
                    (id, title, subtitle, start_date, end_date, artist_id, tour_image)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `,
            [
                tourId,
                title.trim(),
                description || null,
                startDate,
                endDate,
                artistId,
                imageId,
            ]
        );

        // 3.7 Für jedes Genre-Objekt → alle Subgenre-IDs in tour_subgenres einfügen
        for (const blk of tourGenres) {
            for (const subId of blk.subgenreIds) {
                await client.query(
                    `
          INSERT INTO tour_subgenres (tour_id, subgenre_id)
          VALUES ($1, $2)
          `,
                    [tourId, subId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tour erstellt', tour: createdTour });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create-tour error:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen der Tour' });
    }
});

app.post('/create-city', express.json(), async (req, res) => {
    try {
        const { name, countryId } = req.body;
        if (!name || !name.trim() || !countryId) {
            return res.status(400).json({ message: 'Name und Land sind erforderlich' });
        }

        const cityId = uuidv4();
        const result = await client.query(
            `INSERT INTO cities (id, name, country_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, country_id AS "countryId"`,
            [cityId, name.trim(), countryId]
        );

        res.status(201).json({ message: 'Stadt erstellt', city: result.rows[0] });
    } catch (error) {
        console.error('Create-city error:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen der Stadt' });
    }
});
// server.js (Express-Backend)

// GET: Alle Städte für Dropdown
app.get('/cities', async (req, res) => {
    try {
        const result = await client.query('SELECT id, name FROM cities ORDER BY name');
        res.status(200).json({ cities: result.rows });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: 'Fehler beim Laden der Städte' });
    }
});

// POST: Venue erstellen (mit capacity & website)
// server.js (Express-Backend)

// GET: disability_marks für Dropdown
app.get('/disability-marks', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT mark_code, description FROM disability_marks ORDER BY mark_code'
        );
        res.json({ marks: result.rows });
    } catch (err) {
        console.error('Error fetching disability marks', err);
        res.status(500).json({ message: 'Fehler beim Laden der Markierungen' });
    }
});

// POST: Venue inkl. Behinderten-Kapazitäten
// server.js (Express-Backend with venue_disability_area_capacity)

// GET: disability_areas für Dropdown
app.get('/disability-areas', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT DISTINCT area_name FROM disability_area ORDER BY area_name'
        );
        res.json({ areas: result.rows });
    } catch (err) {
        console.error('Error fetching disability areas:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Bereiche' });
    }
});

// POST: Venue erstellen (inkl. area capacities)
app.post('/create-venue', express.json(), async (req, res) => {
    const {
        name, address, cityId, capacity, website,
        disabilityCapacities = []
    } = req.body;

    if (!name?.trim() || !address?.trim() || !cityId || capacity == null) {
        return res.status(400).json({
            message: 'Name, Adresse, Stadt und Kapazität sind erforderlich'
        });
    }

    const sumDis = disabilityCapacities
        .reduce((s, dc) => s + (parseInt(dc.capacity, 10) || 0), 0);
    if (sumDis > capacity) {
        return res.status(400).json({
            message: 'Summe der Behinderten-Kapazitäten überschreitet Gesamt-Kapazität'
        });
    }

    try {
        await client.query('BEGIN');
        const venueId = uuidv4();

        const { rows } = await client.query(
            `INSERT INTO venues
                 (id, name, address, city_id, capacity, website)
             VALUES ($1,$2,$3,$4,$5,$6)
             RETURNING *`,
            [venueId, name.trim(), address.trim(), cityId, capacity, website || null]
        );

        for (const dc of disabilityCapacities) {
            await client.query(
                `INSERT INTO venue_disability_area_capacity
                     (venue_id, area_name, capacity)
                 VALUES ($1,$2,$3)`,
                [venueId, dc.area_name, parseInt(dc.capacity, 10)]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Venue erstellt', venue: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create-venue error:', err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Venues' });
    }
});

app.get('/tours', async (req, res) => {
    const result = await client.query('SELECT id, title FROM tours ORDER BY title');
    res.json({ tours: result.rows });
});
app.get('/venues', async (req, res) => {
    const result = await client.query('SELECT id, name FROM venues ORDER BY name');
    res.json({ venues: result.rows });
});
app.post('/create-event', express.json(), async (req, res) => {
    const {
        tourId, venueId,
        doorTime, startTime, endTime,
        description,
        eventArtists = []
    } = req.body;
    if (!tourId || !venueId || !doorTime || !startTime || !endTime) {
        return res.status(400).json({ message: 'Tour, Venue und alle Zeitangaben sind erforderlich' });
    }

    try {
        await client.query('BEGIN');
        const eventId = uuidv4();
        const { rows } = await client.query(
            `INSERT INTO events
        (id, tour_id, venue_id, door_time, start_time, end_time, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
            [eventId, tourId, venueId, doorTime, startTime, endTime, description || null]
        );

        for (const ea of eventArtists) {
            await client.query(
                `INSERT INTO event_artists
          (event_id, artist_id, role)
         VALUES ($1,$2,$3)`,
                [eventId, ea.artistId, ea.role]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Event erstellt', event: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create-event error:', err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Events' });
    }
});

app.post('/create-genre', async (req, res) => {
    const { name, subgenres = [] } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Ein Genre-Name ist erforderlich' });
    }

    // Check that each subgenre has a name
    for (let i = 0; i < subgenres.length; i++) {
        if (!subgenres[i].name || !subgenres[i].name.trim()) {
            return res
                .status(400)
                .json({ message: `Subgenre ${i + 1} benötigt einen Namen` });
        }
    }

    try {
        await client.query('BEGIN');

        // Insert into "genres"
        const genreId = uuidv4();
        const insertGenreText =
            'INSERT INTO genres (id, name) VALUES ($1, $2) RETURNING *';
        const { rows: genreRows } = await client.query(insertGenreText, [
            genreId,
            name.trim(),
        ]);

        // Insert subgenres (one-to-many)
        const insertSubgenreText =
            'INSERT INTO subgenres (id, genre_id, name) VALUES ($1, $2, $3)';
        for (const sg of subgenres) {
            const subId = uuidv4();
            await client.query(insertSubgenreText, [
                subId,
                genreId,
                sg.name.trim(),
            ]);
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Genre und Subgenres erstellt',
            genre: genreRows[0],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create-genre error:', err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Genres' });
    }
});

const credentials = require('./credentials.json')

const client = new Client(credentials);
client.connect();

app.listen(4000, () => console.log('Server on port 4000'));
