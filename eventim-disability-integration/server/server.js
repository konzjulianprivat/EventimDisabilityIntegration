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
            `SELECT
                 va.id,
                 va.area_id AS area_id,
                 va.max_capacity,
                 a.name,
                 a.disability_category_for
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

// GET: Detailed venues with city information
app.get('/venues-detailed', async (req, res) => {
    try {
        const { rows } = await client.query(
            `SELECT v.id,
                    v.name,
                    v.address,
                    v.city_id    AS "cityId",
                    v.website,
                    c.name       AS city_name
             FROM venues v
                      LEFT JOIN cities c ON c.id = v.city_id
             ORDER BY v.name`
        );
        res.json({ venues: rows });
    } catch (err) {
        console.error('Error fetching detailed venues:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Venues' });
    }
});

// PUT: Update a venue and its areas
app.put('/venues/:id', async (req, res) => {
    const venueId = req.params.id;
    const { name, address, cityId, website, venueAreas = [] } = req.body;

    if (!name?.trim() || !address?.trim() || !cityId) {
        return res
            .status(400)
            .json({ message: 'Name, Adresse und Stadt sind erforderlich' });
    }

    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE venues
                 SET name = $1,
                     address = $2,
                     city_id = $3,
                     website = $4,
                     updated_at = NOW()
               WHERE id = $5`,
            [name.trim(), address.trim(), cityId, website || null, venueId]
        );

        // Bestehende Areas laden
        const { rows: existing } = await client.query(
            'SELECT id FROM venue_areas WHERE venue_id = $1',
            [venueId]
        );
        const remaining = new Set(existing.map((r) => r.id));

        for (const va of venueAreas) {
            if (va.id && remaining.has(va.id)) {
                await client.query(
                    `UPDATE venue_areas
                         SET area_id = $1,
                             max_capacity = $2
                       WHERE id = $3`,
                    [va.areaId, va.maxCapacity, va.id]
                );
                remaining.delete(va.id);
            } else if (!va.id) {
                await client.query(
                    `INSERT INTO venue_areas (id, venue_id, area_id, max_capacity)
                     VALUES ($1, $2, $3, $4)`,
                    [uuidv4(), venueId, va.areaId, va.maxCapacity]
                );
            }
        }

        // Übrig gebliebene löschen
        for (const delId of remaining) {
            await client.query('DELETE FROM venue_areas WHERE id = $1', [delId]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Venue aktualisiert' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update-venue error:', err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Venues' });
    }
});

// DELETE: remove a venue completely
app.delete('/venues/:id', async (req, res) => {
    const venueId = req.params.id;
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM venue_areas WHERE venue_id = $1', [venueId]);
        await client.query('DELETE FROM venues WHERE id = $1', [venueId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Venue gelöscht' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete-venue error:', err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Venues' });
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

            // Determine disability_support_for either from payload or via marks
            let disabilitySupport = cat.disabilitySupport || null;
            if (!disabilitySupport) {
                for (const entry of cat.venueAreas) {
                    const { rows: vaRows } = await client.query(
                        'SELECT area_id FROM venue_areas WHERE id = $1',
                        [entry.areaId]
                    );
                    const areaId = vaRows[0] && vaRows[0].area_id;
                    if (areaId) {
                        const { rows: markRows } = await client.query(
                            'SELECT mark_code FROM disability_marks WHERE area_id = $1',
                            [areaId]
                        );
                        for (const r of markRows) {
                            const code = (r.mark_code || '').trim();
                            if (code === 'G' || code === 'aG') {
                                disabilitySupport = 'G';
                            } else if (code === 'Bl') {
                                disabilitySupport = 'Bl';
                            } else if (code === 'Gl') {
                                disabilitySupport = 'Gl';
                            }
                            if (disabilitySupport) break;
                        }
                    }
                    if (disabilitySupport) break;
                }
            }

            // 3b) Insert into event_categories
            await client.query(
                `INSERT INTO event_categories
                     (id, event_id, name, price, disability_support_for)
                 VALUES ($1, $2, $3, $4, $5)`,
                [catId, eventId, cat.name || null, cat.price, disabilitySupport]
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
            'INSERT INTO areas (id, name, description, disability_category_for) VALUES ($1, $2, $3, $4)',
            [areaId, name.trim(), description || null, null]
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

app.put('/artists/:id', upload.single('artist_image'), async (req, res) => {
    const artistId = req.params.id;

    try {
        // 1) Zunächst aktuelle artist_image auslesen
        const { rows } = await client.query(
            'SELECT artist_image FROM artists WHERE id = $1',
            [artistId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Artist nicht gefunden' });
        }
        const oldImageId = rows[0].artist_image;

        // 2) Neue Felder (name/biography/website) updaten
        //    (artist_image aktualisieren wir weiter unten)
        const { name, biography, website } = req.body;
        await client.query(
            `UPDATE artists
               SET name = $1,
                   biography = $2,
                   website = $3
             WHERE id = $4`,
            [name || null, biography || null, website || null, artistId]
        );

        // 3) Falls ein neues Bild hochgeladen wurde:
        if (req.file) {
            // a) Neues image-Record anlegen
            const newImageId = uuidv4();
            await client.query(
                `INSERT INTO images
                    (id, image_data, image_type, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newImageId, req.file.buffer, req.file.mimetype, 'artist', artistId]
            );

            // b) artists.artist_image auf newImageId setzen
            await client.query(
                `UPDATE artists
                   SET artist_image = $1
                 WHERE id = $2`,
                [newImageId, artistId]
            );

            // c) altes Bild löschen (nur wenn existiert)
            if (oldImageId) {
                await client.query(
                    'DELETE FROM images WHERE id = $1',
                    [oldImageId]
                );
            }
        }

        return res.status(200).json({ message: 'Artist aktualisiert' });
    } catch (err) {
        console.error('Update-Artist error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Künstlers' });
    }
});
app.delete('/artists/:id', async (req, res) => {
    const artistId = req.params.id;
    try {
        // 1) hole artist_image id
        const { rows } = await client.query(
            'SELECT artist_image FROM artists WHERE id = $1',
            [artistId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Artist nicht gefunden' });
        }
        const imageId = rows[0].artist_image;

        // 2) lösche Künstler
        await client.query('DELETE FROM artists WHERE id = $1', [artistId]);

        // 3) lösche zugehöriges Bild, falls vorhanden
        if (imageId) {
            await client.query('DELETE FROM images WHERE id = $1', [imageId]);
        }

        return res.status(200).json({ message: 'Artist gelöscht' });
    } catch (err) {
        console.error('Delete-Artist error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Löschen des Künstlers' });
    }
});

app.delete('/artists/:id', async (req, res) => {
    const artistId = req.params.id;
    try {
        // 1) hole artist_image id
        const { rows } = await client.query(
            'SELECT artist_image FROM artists WHERE id = $1',
            [artistId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Artist nicht gefunden' });
        }
        const imageId = rows[0].artist_image;

        // 2) lösche Künstler
        await client.query('DELETE FROM artists WHERE id = $1', [artistId]);

        // 3) lösche zugehöriges Bild, falls vorhanden
        if (imageId) {
            await client.query('DELETE FROM images WHERE id = $1', [imageId]);
        }

        return res.status(200).json({ message: 'Artist gelöscht' });
    } catch (err) {
        console.error('Delete-Artist error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Löschen des Künstlers' });
    }
});

// … ganz oben: express, client etc. importieren …

// server.js (vollständiger Endpoint)

app.get('/tours-detailed', async (req, res) => {
    try {
        // 0) Vorab: Alle disability_marks abfragen (area_id → mark_code), aber trim() auf mark_code
        const { rows: allMarks } = await client.query(`
            SELECT area_id, mark_code
            FROM disability_marks
            WHERE area_id IS NOT NULL;
        `);

        // Baue eine Map: area_id → [mark_code1, mark_code2, ...] (mark_code getrimmt)
        const marksMap = {};
        allMarks.forEach((row) => {
            const aid = row.area_id;
            const code = row.mark_code.trim(); // hier trimmen
            if (!marksMap[aid]) marksMap[aid] = [];
            if (!marksMap[aid].includes(code)) {
                marksMap[aid].push(code);
            }
        });

        console.log('marksMap (disability_marks):', marksMap);

        // 1) Alle Tours holen
        const { rows: tourRows } = await client.query(`
            SELECT
                t.id,
                t.title,
                t.subtitle,
                t.start_date,
                t.end_date,
                t.tour_image
            FROM tours t
            ORDER BY t.start_date;
        `);

        console.log('Gefundene Tours (raw):', tourRows);

        // 2) Pro Tour alle Detail-Informationen zusammensetzen
        const detailedTours = await Promise.all(
            tourRows.map(async (tour) => {
                // 2a) Event-Anzahl
                const { rows: countRows } = await client.query(
                    `SELECT COUNT(*) AS "eventCount" FROM events WHERE tour_id = $1`,
                    [tour.id]
                );
                const eventCount = parseInt(countRows[0].eventCount, 10);

                // 2b) Günstigster Preis über alle Event-Kategorien
                const { rows: cheapestRows } = await client.query(
                    `
                        SELECT MIN(ec.price)::numeric(10,2) AS "cheapestPrice"
                        FROM event_categories ec
                                 JOIN events e ON e.id = ec.event_id
                        WHERE e.tour_id = $1
                    `,
                    [tour.id]
                );
                const cheapestPrice = cheapestRows[0].cheapestPrice !== null
                    ? parseFloat(cheapestRows[0].cheapestPrice)
                    : null;

                // 2c) Grunddaten aller Events dieser Tour (ohne Accessibility)
                const { rows: baseEvents } = await client.query(
                    `
                        SELECT
                            e.id,
                            e.start_time,
                            v.name AS "venueName",
                            c.name AS "cityName"
                        FROM events e
                                 JOIN venues v ON v.id = e.venue_id
                                 JOIN cities c ON c.id = v.city_id
                        WHERE e.tour_id = $1
                        ORDER BY e.start_time
                    `,
                    [tour.id]
                );

                console.log(`Tour ${tour.id} – baseEvents:`, baseEvents);

                // 2d) Pro Event: Disability-Labels berechnen
                const eventsWithAccess = await Promise.all(
                    baseEvents.map(async (ev) => {
                        // 2d.1) Alle zugehörigen venue_area_id aus event_venue_areas holen
                        const { rows: evaRows } = await client.query(
                            `
                                SELECT venue_area_id
                                FROM event_venue_areas
                                WHERE event_id = $1
                            `,
                            [ev.id]
                        );

                        // 2d.2) Für jeden venue_area_id das area_id aus venue_areas holen
                        const areaIds = [];
                        for (const eva of evaRows) {
                            const { rows: vaRows } = await client.query(
                                `
                                    SELECT area_id
                                    FROM venue_areas
                                    WHERE id = $1
                                `,
                                [eva.venue_area_id]
                            );
                            if (vaRows[0] && vaRows[0].area_id) {
                                areaIds.push(vaRows[0].area_id);
                            }
                        }

                        console.log(`Event ${ev.id} – areaIds in venue_areas:`, areaIds);

                        // 2d.3) Prüfe nun, welche dieser area_id in marksMap existieren, und sammele alle mark_code
                        const collectedCodes = new Set();
                        areaIds.forEach((aid) => {
                            if (marksMap[aid]) {
                                marksMap[aid].forEach((code) => {
                                    collectedCodes.add(code);
                                });
                            }
                        });

                        // 2d.4) Mappe jeden mark_code (bereits getrimmt) zu seinem Label‐Text
                        const labels = Array.from(collectedCodes).map((code) => {
                            switch (code) {
                                case 'G':
                                case 'aG':
                                    return 'Rollstuhlplätze verfügbar';
                                case 'Gl':
                                    return 'Gehörlosenplätze verfügbar';
                                case 'Bl':
                                    return 'Blindenplätze verfügbar';
                                default:
                                    return null;
                            }
                        }).filter((lbl) => lbl !== null);

                        return {
                            id: ev.id,
                            cityName: ev.cityName,
                            venueName: ev.venueName,
                            start_time: ev.start_time,
                            accessibility: labels, // dedupliziert durch Set
                        };
                    })
                );

                console.log(`Tour ${tour.id} – eventsWithAccess:`, eventsWithAccess);

                // 2e) Künstler-Liste für diese Tour
                const { rows: artistRows } = await client.query(
                    `
                        SELECT a.name
                        FROM tour_artists ta
                                 JOIN artists a ON a.id = ta.artist_id
                        WHERE ta.tour_id = $1
                        ORDER BY a.name
                    `,
                    [tour.id]
                );
                const artistsList = artistRows.map((r) => r.name);

                // 2f) Genres mit Subgenres:
                const { rows: genreRows } = await client.query(
                    `
                        SELECT
                            g.id                AS "genreId",
                            g.name              AS "genreName",
                            COALESCE(
                                            json_agg(s.name) FILTER (WHERE s.id IS NOT NULL),
                                            '[]'
                            ) AS "subgenreNames"
                        FROM tour_genres tg
                                 JOIN genres g ON g.id = tg.genre_id
                                 LEFT JOIN tour_subgenres ts
                                           ON ts.tour_id = tg.tour_id
                                 LEFT JOIN subgenres s
                                           ON s.id = ts.subgenre_id
                                               AND s.genre_id = tg.genre_id
                        WHERE tg.tour_id = $1
                        GROUP BY g.id, g.name
                        ORDER BY g.name
                    `,
                    [tour.id]
                );
                const genresWithSubs = genreRows.map((r) => ({
                    genreId: r.genreId,
                    genreName: r.genreName,
                    subgenreNames: r.subgenreNames || [],
                }));

                return {
                    id: tour.id,
                    title: tour.title,
                    subtitle: tour.subtitle,
                    start_date: tour.start_date,
                    end_date: tour.end_date,
                    tour_image: tour.tour_image,
                    eventCount,
                    cheapestPrice,
                    artistsList,
                    genresWithSubs,
                    events: eventsWithAccess,
                };
            })
        );

        console.log('detailedTours insgesamt:', detailedTours);
        return res.status(200).json({ tours: detailedTours });
    } catch (err) {
        console.error('Error in /tours-detailed:', err);
        return res.status(500).json({ message: 'Fehler beim Laden der Touren' });
    }
});

// 2) PUT /tours/:id – bearbeitet Titel, Subtitle, Start/End‐Datum und optional das Tour‐Bild
app.put('/tours/:id', upload.single('tour_image'), async (req, res) => {
    const tourId = req.params.id;
    try {
        // 1) Existenz prüfen und altes Bild ermitteln
        const { rows: existingTour } = await client.query(
            'SELECT tour_image FROM tours WHERE id = $1',
            [tourId]
        );
        if (existingTour.length === 0) {
            return res.status(404).json({ message: 'Tour nicht gefunden' });
        }
        const oldImageId = existingTour[0].tour_image;

        // 2) Titel/Subtitle/Start/End updaten
        const { title, subtitle, startDate, endDate, artistsJson, genresJson } = req.body;
        await client.query(
            `
                UPDATE tours
                SET title      = $1,
                    subtitle   = $2,
                    start_date = $3,
                    end_date   = $4,
                    updated_at = NOW()
                WHERE id = $5
            `,
            [title || null, subtitle || null, startDate || null, endDate || null, tourId]
        );

        // 3) Neues Bild speichern (falls hochgeladen)
        if (req.file) {
            const newImageId = uuidv4();
            await client.query(
                `
                    INSERT INTO images (
                        id, image_data, image_type, entity_type, entity_id
                    ) VALUES ($1, $2, $3, $4, $5)
                `,
                [newImageId, req.file.buffer, req.file.mimetype, 'tour', tourId]
            );
            // Tour-Datensatz aktualisieren
            await client.query(
                `UPDATE tours SET tour_image = $1 WHERE id = $2`,
                [newImageId, tourId]
            );
            // altes Bild löschen
            if (oldImageId) {
                await client.query('DELETE FROM images WHERE id = $1', [oldImageId]);
            }
        }

        // 4) Künstler-Zuordnungen neu setzen (tour_artists)
        if (artistsJson) {
            let artistIds;
            try {
                artistIds = JSON.parse(artistsJson);
                if (!Array.isArray(artistIds)) throw new Error();
            } catch {
                return res.status(400).json({ message: 'Ungültiges Format für artistsJson' });
            }
            // a) Alte Einträge entfernen
            await client.query('DELETE FROM tour_artists WHERE tour_id = $1', [tourId]);
            // b) Neue Einträge hinzufügen
            for (const aid of artistIds) {
                await client.query(
                    `INSERT INTO tour_artists (tour_id, artist_id) VALUES ($1, $2)`,
                    [tourId, aid]
                );
            }
        }

        // 5) Genre/Subgenre-Zuordnungen neu setzen
        if (genresJson) {
            let genreBlocks;
            try {
                genreBlocks = JSON.parse(genresJson);
                if (!Array.isArray(genreBlocks)) throw new Error();
            } catch {
                return res.status(400).json({ message: 'Ungültiges Format für genresJson' });
            }
            // a) Alte Zuordnungen löschen
            await client.query('DELETE FROM tour_subgenres WHERE tour_id = $1', [tourId]);
            await client.query('DELETE FROM tour_genres    WHERE tour_id = $1', [tourId]);
            // b) Neue einfügen
            for (const gb of genreBlocks) {
                const genreId = gb.genreId;
                // 5b-1) tour_genres
                await client.query(
                    `INSERT INTO tour_genres (tour_id, genre_id) VALUES ($1, $2)`,
                    [tourId, genreId]
                );
                // 5b-2) tour_subgenres (nur (tour_id, subgenre_id), kein drittes Feld!)
                if (Array.isArray(gb.subgenreIds)) {
                    for (const sid of gb.subgenreIds) {
                        await client.query(
                            `INSERT INTO tour_subgenres (tour_id, subgenre_id) VALUES ($1, $2)`,
                            [tourId, sid]
                        );
                    }
                }
            }
        }

        return res.status(200).json({ message: 'Tour inkl. Künstler & Genres aktualisiert' });
    } catch (err) {
        console.error('Update-Tour error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Tour' });
    }
});

// 3) DELETE /tours/:id – löscht eine Tour und dessen zugehöriges Bild
app.delete('/tours/:id', async (req, res) => {
    const tourId = req.params.id;
    try {
        // 3a) hole tour_image Id
        const { rows } = await client.query(
            'SELECT tour_image FROM tours WHERE id = $1',
            [tourId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tour nicht gefunden' });
        }
        const imageId = rows[0].tour_image;

        // 3b) lösche Tour
        await client.query('DELETE FROM tours WHERE id = $1', [tourId]);

        // 3c) lösche zugehöriges Bild, falls vorhanden
        if (imageId) {
            await client.query('DELETE FROM images WHERE id = $1', [imageId]);
        }

        return res.status(200).json({ message: 'Tour gelöscht' });
    } catch (err) {
        console.error('Delete‐Tour error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Löschen der Tour' });
    }
});

app.get('/tour-artists', async (req, res) => {
    const { tourId } = req.query;
    if (!tourId) {
        return res.status(400).json({ message: 'tourId ist erforderlich' });
    }
    try {
        const { rows } = await client.query(
            `
            SELECT a.id, a.name
            FROM tour_artists ta
            JOIN artists a ON a.id = ta.artist_id
            WHERE ta.tour_id = $1
            ORDER BY a.name
            `,
            [tourId]
        );
        // rows = [ { id: <UUID>, name: <string> }, … ]
        res.status(200).json({ artists: rows });
    } catch (err) {
        console.error('Error fetching tour artists:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Tour‐Künstler' });
    }
});

/**
 * 2) GET /tour-genres?tourId=<UUID>
 *    → Gibt pro Genre, das zur Tour gehört, ein Objekt zurück:
 *      { genreId, genreName, subgenreIds: [<UUID>, …] }
 */
app.get('/tour-genres', async (req, res) => {
    const { tourId } = req.query;
    if (!tourId) {
        return res.status(400).json({ message: 'tourId ist erforderlich' });
    }
    try {
        // 1) Zuerst alle Genre-Zuordnungen holen
        const { rows: genreRows } = await client.query(
            `
                SELECT g.id   AS genre_id,
                       g.name AS genre_name
                FROM tour_genres tg
                         JOIN genres g
                              ON g.id = tg.genre_id
                WHERE tg.tour_id = $1
                ORDER BY g.name
            `,
            [tourId]
        );
        // genreRows = [ { genre_id, genre_name }, … ]

        // 2) Für jedes Genre die Subgenres abfragen, die tatsächlich dieser Tour zugeordnet sind
        const tourGenresWithSubs = [];
        for (const gr of genreRows) {
            const { rows: subRows } = await client.query(
                `
                    SELECT s.id AS subgenre_id
                    FROM tour_subgenres ts
                             JOIN subgenres s
                                  ON s.id = ts.subgenre_id
                    WHERE ts.tour_id = $1
                      AND s.genre_id = $2
                    ORDER BY s.name
                `,
                [tourId, gr.genre_id]
            );
            // subRows = [ { subgenre_id }, … ]

            tourGenresWithSubs.push({
                genreId: gr.genre_id,
                genreName: gr.genre_name,
                subgenreIds: subRows.map((r) => r.subgenre_id),
            });
        }

        res.status(200).json({ tourGenres: tourGenresWithSubs });
    } catch (err) {
        console.error('Error fetching tour genres:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Tour-Genres' });
    }
});

// In server.js (Express-Backend):

// 1) Hilfsfunktion: mark_code → Label
const mapMarkCodeToLabel = (mark_code) => {
    switch (mark_code) {
        case 'G':
        case 'aG':
            return 'Rollstuhlplätze verfügbar';
        case 'Gl':
            return 'Gehörlosenplätze verfügbar';
        case 'Bl':
            return 'Blindenplätze verfügbar';
        default:
            return null;
    }
};

// 2) Neuer Endpoint: Liefert pro Event einer Tour dessen Basis-Daten + accessibility-Labels
app.get('/events-with-accessibility', async (req, res) => {
    const { tourId } = req.query;
    if (!tourId) {
        return res.status(400).json({ message: 'tourId als Query-Parameter ist erforderlich' });
    }

    try {
        // Events samt zugehöriger disability_support_for Codes aus event_categories abrufen
        const { rows } = await client.query(
            `
            SELECT
                e.id,
                e.start_time,
                v.name AS "venueName",
                c.name AS "cityName",
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT ec.disability_support_for), NULL) AS codes
            FROM events e
                JOIN venues v ON v.id = e.venue_id
                JOIN cities c ON c.id = v.city_id
                LEFT JOIN event_categories ec ON ec.event_id = e.id
            WHERE e.tour_id = $1
            GROUP BY e.id, e.start_time, v.name, c.name
            ORDER BY e.start_time;
            `,
            [tourId]
        );

        const result = rows.map((ev) => {
            const labels = (ev.codes || [])
                .map((code) => mapMarkCodeToLabel(code && code.trim()))
                .filter((lbl) => lbl !== null);

            return {
                id: ev.id,
                cityName: ev.cityName,
                venueName: ev.venueName,
                start_time: ev.start_time,
                accessibility: Array.from(new Set(labels)),
            };
        });

        return res.status(200).json({ events: result });
    } catch (error) {
        console.error('Error in /events-with-accessibility:', error);
        return res.status(500).json({ message: 'Serverfehler beim Laden der Events' });
    }
});

app.get('/event-accessibility', async (req, res) => {
    const eventId = req.query.eventId;
    if (!eventId) {
        return res.status(400).json({ message: 'eventId als Query-Parameter ist erforderlich.' });
    }

    try {
        // Alle disability_support_for Codes aus event_categories für das Event abrufen
        const { rows } = await client.query(
            `
                SELECT DISTINCT disability_support_for AS code
                FROM event_categories
                WHERE event_id = $1
            `,
            [eventId]
        );

        const labels = rows
            .map((r) => mapMarkCodeToLabel(r.code && r.code.trim()))
            .filter((lbl) => lbl !== null);

        const uniqueLabels = Array.from(new Set(labels));

        return res.status(200).json({ accessibilityLabels: uniqueLabels });
    } catch (err) {
        console.error('Error in /event-accessibility:', err);
        return res.status(500).json({ message: 'Fehler beim Abrufen der Accessibility-Labels' });
    }
});


const client = new Client(credentials);
client.connect();

app.listen(4000, () => console.log('Server on port 4000'));
