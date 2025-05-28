const express = require('express');
const cors = require('cors');
const path = require('path');
const { Client } = require('pg');
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
            firstName, lastName, email, password, birthDate, phone,
            disabilityCheck, disabilityDegree,
            streetAddress, city, postalCode, country,
            company, salutation
        } = req.body;

        // Check if user already exists
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate user_id using uuidv4
        const userId = uuidv4();

        // Initialize imageId outside the if block
        let imageId = null;

        // Process the image if uploaded - BEFORE user insertion
        if (req.file) {
            imageId = uuidv4(); // Remove 'const' to update the outer variable
            const imageBuffer = req.file.buffer;
            const mimeType = req.file.mimetype;

            // Save image to images table with reference to user - fixed parameter count
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
                [imageId, imageBuffer, mimeType, 'user', userId]
            );
        }

        const result = await client.query(
            `INSERT INTO users (
                user_id, first_name, last_name, email, password,
                birth_date, phone, disability_check, disability_degree,
                street_address, city, postal_code, country,
                company, salutation, disability_card_image
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 
                $10, $11, $12, $13, $14, $15, $16
            ) RETURNING *`,
            [
                userId, firstName, lastName, email, password,
                birthDate || null, phone || null, disabilityCheck === 'true', disabilityDegree || null,
                streetAddress, city, postalCode, country || 'Deutschland',
                company || null, salutation || null, imageId
            ]
        );

        // Return success without sending password back
        const user = result.rows[0];
        delete user.password;

        res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/register', upload.single('disabilityCardImage'), async (req, res) => {
    try {
        const {
            firstName, lastName, email, password, birthDate, phone,
            disabilityCheck, disabilityDegree,
            streetAddress, city, postalCode, country,
            company, salutation
        } = req.body;

        // Check if user already exists
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate user_id using uuidv4
        const userId = uuidv4();

        // Initialize imageId outside the if block
        let imageId = null;

        // Process the image if uploaded - BEFORE user insertion
        if (req.file) {
            imageId = uuidv4(); // Remove 'const' to update the outer variable
            const imageBuffer = req.file.buffer;
            const mimeType = req.file.mimetype;

            // Save image to images table with reference to user - fixed parameter count
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
                [imageId, imageBuffer, mimeType, 'user', userId]
            );
        }

        // Insert new user with disability_card_image if available
        const result = await client.query(
            `INSERT INTO users (
                user_id, first_name, last_name, email, password,
                birth_date, phone, disability_check, disability_degree,
                street_address, city, postal_code, country,
                company, salutation, disability_card_image
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 
                $10, $11, $12, $13, $14, $15, $16
            ) RETURNING *`,
            [
                userId, firstName, lastName, email, password,
                birthDate || null, phone || null, disabilityCheck === 'true', disabilityDegree || null,
                streetAddress, city, postalCode, country || 'Deutschland',
                company || null, salutation || null, imageId
            ]
        );

        // Return success without sending password back
        const user = result.rows[0];
        delete user.password;

        res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
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
        const { name, biography, website, countryId } = req.body;

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
            `INSERT INTO artists (id, name, biography, website, country_id, artist_image)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [artistId, name.trim(), biography || null, website || null, countryId, imageId]
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
app.post('/create-tour', upload.single('tourImage'), async (req, res) => {
    try {
        const { title, description, startDate, endDate, artistId } = req.body;
        if (!title || !startDate || !endDate || !artistId) {
            return res.status(400).json({ message: 'Titel, Startdatum, Enddatum und Künstler sind erforderlich' });
        }
        const tourId = uuidv4();
        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)',
                [imageId, req.file.buffer, req.file.mimetype, 'tour', tourId]
            );
        }
        const result = await client.query(
            `INSERT INTO tours (id, title, subtitle, start_date, end_date, artist_id, tour_image)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [tourId, title.trim(), description||null, startDate, endDate, artistId, imageId]
        );
        res.status(201).json({ message: 'Tour erstellt', tour: result.rows[0] });
    } catch (error) {
        console.error('Create-tour error:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen der Tour' });
    }
});

const credentials = require('./credentials.json')

const client = new Client(credentials);
client.connect();

app.listen(4000, () => console.log('Server on port 4000'));
