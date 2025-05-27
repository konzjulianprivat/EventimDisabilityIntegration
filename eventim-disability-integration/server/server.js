const express = require('express');
const cors = require('cors');
const path = require('path');
const { Client } = require('pg');
const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, dateOfBirth, phone, accessibilityNeeds } = req.body;

        // Check if user already exists
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Insert new user
        const result = await client.query(
            'INSERT INTO users (first_name, last_name, email, password, date_of_birth, phone, accessibility_needs) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [firstName, lastName, email, password, dateOfBirth || null, phone || null, accessibilityNeeds || null]
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

const credentials = require('./credentials.json')

const client = new Client(credentials);
client.connect();

app.listen(4000, () => console.log('Server on port 4000'));
