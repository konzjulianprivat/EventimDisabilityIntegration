const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({
    origin: 'http://localhost:3000',    // your Next.js dev origin
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const credentials = require('./credentials.json')

app.use(
    session({
        name: 'sid',                        // the name of the cookie (optional)
        secret: 'credentials.sessionSecret',    // replace with an env var in production
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,                    // in prod, set to true if using HTTPS
            sameSite: 'lax',                  // or 'none' if your front & back are on different domains with HTTPS
            maxAge: 1000 * 60 * 60
        },
    })
);

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

// In your server.js (oder ein passendes Router-Modul), stelle sicher, dass:
// - express, multer, bcrypt, uuid und dein PostgreSQL-Client (client) bereits importiert/configured sind.
// - `upload` ist der multer-Middleware, z.B.:
//     const multer = require('multer');
//     const upload = multer({ storage: multer.memoryStorage() });

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

        // 1) Pflichtfelder prüfen
        if (!email || !password || !firstName || !lastName) {
            return res
                .status(400)
                .json({ message: 'Vorname, Nachname, E-Mail und Passwort sind erforderlich.' });
        }

        // 2) Prüfen, ob E-Mail schon existiert
        const userCheck = await client.query('SELECT user_id FROM users WHERE email = $1', [
            email.trim(),
        ]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'E-Mail ist bereits registriert.' });
        }

        // 3) Neues user_id generieren
        const userId = uuidv4();

        // 4) Passwort hashen
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds);

        // 5) Behindertenausweis‐Bild verarbeiten (falls vorhanden)
        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                `INSERT INTO images (id, image_data, image_type, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [imageId, req.file.buffer, req.file.mimetype, 'user', userId]
            );
        }

        // 6) Benutzer in users‐Tabelle einfügen
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
                hashedPass,
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

        const newUser = result.rows[0];
        delete newUser.password; // Passwort nicht zurückgeben

        // 7) NEU: Gewählte Disability‐Marks speichern
        //    Erwartet: req.body.disabilityMarks ist ein JSON-String-Array der mark_code-Werte
        if (req.body.disabilityMarks) {
            try {
                const marksArray = JSON.parse(req.body.disabilityMarks);
                if (Array.isArray(marksArray) && marksArray.length > 0) {
                    for (const markCode of marksArray) {
                        await client.query(
                            'INSERT INTO user_disability_marks (user_id, mark_code) VALUES ($1, $2)',
                            [userId, markCode]
                        );
                    }
                }
            } catch (parseErr) {
                console.error('Error parsing disabilityMarks:', parseErr);
                // Falls Parsing fehlschlägt, ignorieren wir es (Registrierung ist trotzdem erfolgreich)
            }
        }

        // 8) Erfolgreiche Antwort
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

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'E-Mail und Passwort sind erforderlich.' });
        }

        const result = await client.query(
            `
                SELECT
                    user_id,
                    email,
                    password,
                    first_name,
                    last_name,
                    created_at,
                    updated_at
                FROM users
                WHERE email = $1
                LIMIT 1
            `,
            [email.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        req.session.userId = user.user_id;
        req.session.email = user.email;

        return res.status(200).json({
            message: 'Login erfolgreich',
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
        });
    } catch (err) {
        console.error('Login-Fehler:', err);
        return res
            .status(500)
            .json({ message: 'Serverfehler beim Einloggen.' });
    }
});

// 4) GET /session-status – prüft, ob req.session.userId existiert
app.get('/session-status', async (req, res) => {
    if (!req.session.userId) {
        // Keine gültige Session → nicht eingeloggt
        return res.status(200).json({ loggedIn: false });
    }

    try {
        // Hole first_name + last_name + email aus der DB via userId
        const { rows } = await client.query(
            `SELECT first_name, last_name, email
       FROM users
       WHERE user_id = $1
       LIMIT 1`,
            [req.session.userId]
        );

        if (rows.length === 0) {
            // Sollte eigentlich nicht vorkommen, aber fallback
            return res.status(200).json({ loggedIn: false });
        }

        const { first_name, last_name, email } = rows[0];
        return res.status(200).json({
            loggedIn: true,
            user: {
                userId:    req.session.userId,
                email:     email,
                firstName: first_name,
                lastName:  last_name,
            },
        });
    } catch (err) {
        console.error('Error in /session-status:', err);
        return res.status(500).json({ loggedIn: false });
    }
});

// 5) GET /logout – um die Session zu zerstören
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ message: 'Logout fehlgeschlagen.' });
        }
        // Cookie löschen
        res.clearCookie('sid');
        return res.status(200).json({ message: 'Erfolgreich ausgeloggt.' });
    });
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

        const result = await client.query(`SELECT id, name, biography, website, artist_image FROM artists ORDER BY name
    `);
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
    try {
        // 1) Aus dem Body lesen
        const {
            title,
            description,
            startDate,
            endDate,
            artistIdsJson,
            genres: genresJson,
        } = req.body;

        // 2) Pflichtfelder prüfen
        if (
            !title ||
            !startDate ||
            !endDate ||
            !artistIdsJson ||
            typeof artistIdsJson !== 'string'
        ) {
            return res.status(400).json({
                message: 'Titel, Startdatum, Enddatum und mindestens ein Künstler sind erforderlich',
            });
        }

        // 3) artistIds parsen (muss ein nicht-leeres Array sein)
        let artistIds;
        try {
            artistIds = JSON.parse(artistIdsJson);
            if (!Array.isArray(artistIds) || artistIds.length === 0) {
                throw new Error('artistIds ist kein nicht-leeres Array');
            }
        } catch {
            return res.status(400).json({
                message: 'Ungültiges Format für artistIds (erwarte JSON-Array)',
            });
        }

        // 4) tourGenres parsen
        let tourGenres = [];
        if (genresJson) {
            try {
                tourGenres = JSON.parse(genresJson);
            } catch {
                return res.status(400).json({
                    message: 'Ungültiges Format für genres (erwarte JSON-Array)',
                });
            }
        }

        // 5) Validierung: Für jeden Genre-Block muss genreId gesetzt sein und Subgenres vorhanden sein
        for (let i = 0; i < tourGenres.length; i++) {
            const { genreId, subgenreIds } = tourGenres[i] || {};
            if (!genreId) {
                return res.status(400).json({ message: `Genre ${i + 1} muss ausgewählt werden` });
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
            }
        }

        // 6) Validierung: Jede artistId muss ein String sein (optional: weitere DB-Prüfung)
        for (const aid of artistIds) {
            if (typeof aid !== 'string' || aid.trim() === '') {
                return res.status(400).json({ message: 'Ungültige artistIds' });
            }
            // Optional:
            // const { rows: chk } = await client.query('SELECT id FROM artists WHERE id = $1', [aid]);
            // if (chk.length === 0) {
            //   return res.status(400).json({ message: `Künstler ${aid} existiert nicht` });
            // }
        }

        // 7) Transaktion starten
        await client.query('BEGIN');

        // 8) Neue Tour-ID generieren
        const tourId = uuidv4();

        // 9) Tour-Bild speichern (falls vorhanden)
        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                `
                    INSERT INTO images (id, image_data, image_type, entity_type, entity_id)
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    imageId,
                    req.file.buffer,
                    req.file.mimetype,
                    'tour',
                    tourId, // entity_id verweist auf neue Tour
                ]
            );
        }

        // 10) Tour-Datensatz speichern (ohne artist_id, denn viele Künstler möglich)
        const {
            rows: [createdTour],
        } = await client.query(
            `
                INSERT INTO tours
                (id, title, subtitle, start_date, end_date, tour_image, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING *
            `,
            [
                tourId,
                title.trim(),
                description || null,
                startDate,
                endDate,
                imageId,
            ]
        );

        // 11) Genres & Subgenres speichern (unverändert)
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

        // 12) Tour-Artists in Zwischentabelle speichern
        for (const aid of artistIds) {
            await client.query(
                `
                    INSERT INTO tour_artists (tour_id, artist_id)
                    VALUES ($1, $2)
                `,
                [tourId, aid]
            );
        }

        // 13) Commit
        await client.query('COMMIT');
        return res.status(201).json({ message: 'Tour erstellt', tour: createdTour });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create-tour error:', error);
        return res.status(500).json({ message: 'Serverfehler beim Erstellen der Tour' });
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

app.get('/disability-marks', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT mark_code, description, area_id FROM disability_marks ORDER BY mark_code'
        );
        // Jetzt enthält jeder Eintrag zusätzlich area_name, falls Sie in Zukunft danach gruppieren möchten
        res.json({ marks: result.rows });
    } catch (err) {
        console.error('Error fetching disability marks', err);
        res.status(500).json({ message: 'Fehler beim Laden der Markierungen' });
    }
});

// POST: Venue inkl. Behinderten-Kapazitäten
// server.js (Express-Backend with venue_disability_area_capacity)

// GET: areas für Dropdown
app.get('/areas', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, name, description FROM areas ORDER BY name'
        );
        res.json({ areas: result.rows });
    } catch (err) {
        console.error('Error fetching areas:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Bereiche' });
    }
});

// POST: Venue erstellen (inkl. area capacities)
app.post('/create-venue', express.json(), async (req, res) => {
    const {
        name,
        address,
        cityId,
        website,
        venueAreas = [],
    } = req.body;

    if (!name?.trim() || !address?.trim() || !cityId) {
        return res.status(400).json({
            message: 'Name, Adresse und Stadt sind erforderlich'
        });
    }

    try {
        await client.query('BEGIN');
        const venueId = uuidv4();

        const { rows } = await client.query(
            `INSERT INTO venues
                 (id, name, address, city_id, website)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING *`,
            [venueId, name.trim(), address.trim(), cityId, website || null]
        );

        for (const va of venueAreas) {
            await client.query(
                `INSERT INTO venue_areas
                     (id, venue_id, area_id, max_capacity)
                 VALUES ($1,$2,$3,$4)`,
                [uuidv4(), venueId, va.areaId, va.maxCapacity]
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

// GET: Venue areas for a specific venue
app.get('/venue-areas', async (req, res) => {
    const { venueId } = req.query;
    if (!venueId) {
        return res.status(400).json({ message: 'venueId erforderlich' });
    }
    try {
        const { rows } = await client.query(
            `SELECT va.id, va.max_capacity, a.name
             FROM venue_areas va
             JOIN areas a ON a.id = va.area_id
             WHERE va.venue_id = $1
             ORDER BY a.name`,
            [venueId]
        );
        res.json({ venueAreas: rows });
    } catch (err) {
        console.error('Error fetching venue areas:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Venue Areas' });
    }
});
app.post('/create-event', express.json(), async (req, res) => {
    const {
        tourId,
        venueId,
        doorTime,
        startTime,
        endTime,
        description,
        eventArtists = [],
        categories = [],      // now each category is { name, price, venueAreas: [ { areaId, capacity }, … ] }
    } = req.body;

    if (!tourId || !venueId || !doorTime || !startTime || !endTime) {
        return res.status(400).json({ message: 'Tour, Venue und alle Zeitangaben sind erforderlich' });
    }

    try {
        await client.query('BEGIN');
        const eventId = uuidv4();

        // 1) Insert into `events`
        const { rows: eventRows } = await client.query(
            `INSERT INTO events
                 (id, tour_id, venue_id, door_time, start_time, end_time, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING *`,
            [eventId, tourId, venueId, doorTime, startTime, endTime, description || null]
        );

        // 2) Insert any supporting acts
        for (const ea of eventArtists) {
            await client.query(
                `INSERT INTO event_supporting_acts
                     (event_id, artist_id)
                 VALUES ($1, $2)`,
                [eventId, ea.artistId]
            );
        }

        // 3) For each category, insert into `event_categories`, then insert all its venueAreas into `event_venue_areas`
        for (const cat of categories) {
            // 3a) Create a new category_id
            const catId = uuidv4();

            // 3b) Insert into event_categories
            await client.query(
                `INSERT INTO event_categories
                     (id, event_id, name, price)
                 VALUES ($1, $2, $3, $4)`,
                [catId, eventId, cat.name || null, cat.price]
            );

            // 3c) Now iterate over cat.venueAreas[], each one has { areaId, capacity }
            //     and insert into event_venue_areas, linking to this catId.
            //     (ID for event_venue_areas is also a new uuid.)
            for (const entry of cat.venueAreas) {
                await client.query(
                    `INSERT INTO event_venue_areas 
                        (id, event_id, venue_area_id, capacity, category_id) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [uuidv4(), eventId, entry.areaId, entry.capacity, catId]
                );
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ message: 'Event erstellt', event: eventRows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create-event error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Erstellen des Events' });
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

app.get('/genres-with-subgenres', async (req, res) => {
    try {
        // 1) Fetch each genre, plus its subgenres in a single query.
        // We use a LEFT JOIN so that genres without subgenres still appear.
        const { rows } = await client.query(`
      SELECT
        g.id              AS genre_id,
        g.name            AS genre_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS subgenres
      FROM genres g
      LEFT JOIN subgenres s
        ON s.genre_id = g.id
      GROUP BY g.id, g.name
      ORDER BY g.name
    `);

        // 2) Transform rows into a simpler array-of-objects format:
        //    [{ id: <genre_id>, name: <genre_name>, subgenres: [{ id, name }, …] }, …]
        const genresWithSub = rows.map((r) => ({
            id: r.genre_id,
            name: r.genre_name,
            subgenres: r.subgenres,
        }));

        return res.status(200).json({ genres: genresWithSub });
    } catch (error) {
        console.error('Error fetching genres with subgenres:', error);
        return res.status(500).json({ message: 'Fehler beim Laden der Genres und Subgenres' });
    }
});

app.get('/cities-with-venues', async (req, res) => {
    try {
        const { rows } = await client.query(`
      SELECT
        ci.id            AS city_id,
        ci.name          AS city_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'name', v.name
            )
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) AS venues
      FROM cities ci
      LEFT JOIN venues v
        ON v.city_id = ci.id
      GROUP BY ci.id, ci.name
      ORDER BY ci.name
    `);

        const citiesWithVenues = rows.map(r => ({
            id: r.city_id,
            name: r.city_name,
            venues: r.venues
        }));

        return res.status(200).json({ cities: citiesWithVenues });
    } catch (error) {
        console.error('Error fetching cities with venues:', error);
        return res.status(500).json({ message: 'Fehler beim Laden der Städte und Venues' });
    }
});

app.get("/tours-with-images", async (req, res) => {
    try {
        const { rows } = await client.query(
            `SELECT id, title, tour_image
       FROM tours
       ORDER BY title`
        );
        res.status(200).json({ tours: rows });
    } catch (err) {
        console.error("Error fetching tours:", err);
        res.status(500).json({ message: "Fehler beim Laden der Touren" });
    }
});

app.get("/artists-with-images", async (req, res) => {
    try {
        const { rows } = await client.query(
            `SELECT id, name, artist_image
       FROM artists
       ORDER BY name`
        );
        res.status(200).json({ artists: rows });
    } catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({ message: "Fehler beim Laden der Künstler" });
    }
});

app.post('/create-area', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name ist erforderlich' });
        }

        const areaId = uuidv4();
        await client.query(
            'INSERT INTO areas (id, name, description) VALUES ($1, $2, $3)',
            [areaId, name.trim(), description || null]
        );

        return res.status(201).json({
            message: 'Bereich erstellt',
            area: { id: areaId, name: name.trim(), description: description || null }
        });
    } catch (error) {
        console.error('Create-area error:', error);
        return res.status(500).json({ message: 'Serverfehler beim Erstellen des Bereichs' });
    }
});

const client = new Client(credentials);
client.connect();

app.listen(4000, () => console.log('Server on port 4000'));
