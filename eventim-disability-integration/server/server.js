const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const client = db;
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
        secret: credentials.sessionSecret,    // replace with an env var in production
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

app.post('/register-user', upload.fields([
    { name: 'disabilityCardImageFront', maxCount: 1 },
    { name: 'disabilityCardImageBack', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            birthDate,
            phone,
            requestForDisability,
            disabilityDegree,
            disabilityCardExpiryDate,
            streetAddress,
            city,
            postalCode,
            country,
            company,
            salutation,
            visibleUserId,
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

        // 5) Behindertenausweis-Bilder verarbeiten (falls vorhanden)
        let imageFrontId = null;
        let imageBackId = null;
        if (req.files && req.files['disabilityCardImageFront']) {
            const f = req.files['disabilityCardImageFront'][0];
            imageFrontId = uuidv4();
            await client.query(
                `INSERT INTO images (id, image_data, image_type, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [imageFrontId, f.buffer, f.mimetype, 'user', userId]
            );
        }
        if (req.files && req.files['disabilityCardImageBack']) {
            const b = req.files['disabilityCardImageBack'][0];
            imageBackId = uuidv4();
            await client.query(
                `INSERT INTO images (id, image_data, image_type, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [imageBackId, b.buffer, b.mimetype, 'user', userId]
            );
        }

        // 6) ID der Standardrolle ermitteln
        const { rows: roleRows } = await client.query(
            `SELECT id
               FROM user_roles
              WHERE COALESCE(has_account_management_access, false) = false
                AND COALESCE(has_editing_access, false) = false
                AND COALESCE(has_creation_access, false) = false
                AND COALESCE(has_role_appointing_capability, false) = false
              LIMIT 1`
        );

        if (roleRows.length === 0) {
            return res.status(500).json({ message: 'Standardrolle nicht gefunden' });
        }

        const userRoleId = roleRows[0].id;

        // 7) Benutzer in users‐Tabelle einfügen
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
                    request_for_disability,
                    disability_degree,
                    street_address,
                    city,
                    postal_code,
                    country,
                    company,
                    salutation,
                    disability_card_image_front,
                    disability_card_image_back,
                    disability_card_expiry_date,
                    is_currently_disabled,
                    role,
                    visible_user_id,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
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
                requestForDisability === 'true',
                disabilityDegree || null,
                streetAddress.trim(),
                city.trim(),
                postalCode.trim(),
                country?.trim() || 'Deutschland',
                company?.trim() || null,
                salutation?.trim() || null,
                imageFrontId,
                imageBackId,
                disabilityCardExpiryDate || '9999-01-01',
                false,
                userRoleId,
                parseInt(visibleUserId, 10) || Math.floor(Math.random() * 90000000) + 10000000,
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
        if (error.code === '23505' && error.constraint === 'unique_user_email') {
            return res.status(409).json({ message: 'E-Mail ist bereits registriert.' });
        }
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
                    visible_user_id,
                    request_for_disability,
                    is_currently_disabled,
                    disability_card_expiry_date,
                    role,
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

        let cardExpired = false;
        const now = new Date();
        if (
            user.is_currently_disabled &&
            user.disability_card_expiry_date &&
            new Date(user.disability_card_expiry_date) < now
        ) {
            await client.query(
                `UPDATE users
                    SET is_currently_disabled = false,
                        updated_at = NOW()
                  WHERE user_id = $1`,
                [user.user_id]
            );
            user.is_currently_disabled = false;
            cardExpired = true;
        }

        req.session.userId = user.user_id;
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.visibleUserId = user.visible_user_id;

        const { rows: markRows } = await client.query(
            'SELECT mark_code FROM user_disability_marks WHERE user_id = $1',
            [user.user_id]
        );

        const { rows: roleRows } = await client.query(
            `SELECT has_role_appointing_capability,
                    has_disability_approval_access,
                    has_account_management_access,
                    has_creation_access,
                    has_editing_access,
                    has_deletion_permission
               FROM user_roles WHERE id = $1`,
            [user.role]
        );

        const perms = roleRows[0] || {};
        const canAppoint = !!perms.has_role_appointing_capability;
        req.session.hasRoleAppointingCapability = canAppoint;
        req.session.hasDisabilityApprovalAccess = !!perms.has_disability_approval_access;
        req.session.hasAccountManagementAccess = !!perms.has_account_management_access;
        req.session.hasCreationAccess = !!perms.has_creation_access;
        req.session.hasEditingAccess = !!perms.has_editing_access;
        req.session.hasDeletionPermission = !!perms.has_deletion_permission;

        return res.status(200).json({
            message: 'Login erfolgreich',
            cardExpired,
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                requestForDisability: user.request_for_disability,
                isCurrentlyDisabled: user.is_currently_disabled,
                disabilityCardExpiryDate: user.disability_card_expiry_date,
                disabilityMarks: markRows.map((m) => m.mark_code && m.mark_code.trim()),
                role: user.role,
                visibleUserId: user.visible_user_id,
                hasRoleAppointingCapability: canAppoint,
                hasDisabilityApprovalAccess: !!perms.has_disability_approval_access,
                hasAccountManagementAccess: !!perms.has_account_management_access,
                hasCreationAccess: !!perms.has_creation_access,
                hasEditingAccess: !!perms.has_editing_access,
                hasDeletionPermission: !!perms.has_deletion_permission,
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
            `SELECT first_name, last_name, email,
                    request_for_disability,
                    is_currently_disabled,
                    disability_card_expiry_date,
                    role,
                    visible_user_id
       FROM users
       WHERE user_id = $1
       LIMIT 1`,
            [req.session.userId]
        );

        if (rows.length === 0) {
            // Sollte eigentlich nicht vorkommen, aber fallback
            return res.status(200).json({ loggedIn: false });
        }

        const {
            first_name,
            last_name,
            email,
            request_for_disability,
            is_currently_disabled,
            disability_card_expiry_date,
            role,
            visible_user_id,
        } = rows[0];

        if (!req.session.role) {
            req.session.role = role;
        }
        if (!req.session.visibleUserId) {
            req.session.visibleUserId = visible_user_id;
        }

        const { rows: markRows } = await client.query(
            'SELECT mark_code FROM user_disability_marks WHERE user_id = $1',
            [req.session.userId]
        );

        const { rows: roleRows } = await client.query(
            `SELECT has_role_appointing_capability,
                    has_disability_approval_access,
                    has_account_management_access,
                    has_creation_access,
                    has_editing_access,
                    has_deletion_permission
               FROM user_roles WHERE id = $1`,
            [req.session.role]
        );
        const perms = roleRows[0] || {};
        const canAppoint = !!perms.has_role_appointing_capability;
        if (req.session.hasRoleAppointingCapability === undefined) {
            req.session.hasRoleAppointingCapability = canAppoint;
        }
        if (req.session.hasDisabilityApprovalAccess === undefined) {
            req.session.hasDisabilityApprovalAccess = !!perms.has_disability_approval_access;
        }
        if (req.session.hasAccountManagementAccess === undefined) {
            req.session.hasAccountManagementAccess = !!perms.has_account_management_access;
        }
        if (req.session.hasCreationAccess === undefined) {
            req.session.hasCreationAccess = !!perms.has_creation_access;
        }
        if (req.session.hasEditingAccess === undefined) {
            req.session.hasEditingAccess = !!perms.has_editing_access;
        }
        if (req.session.hasDeletionPermission === undefined) {
            req.session.hasDeletionPermission = !!perms.has_deletion_permission;
        }

        return res.status(200).json({
            loggedIn: true,
            user: {
                userId: req.session.userId,
                email,
                firstName: first_name,
                lastName: last_name,
                requestForDisability: request_for_disability,
                isCurrentlyDisabled: is_currently_disabled,
                disabilityCardExpiryDate: disability_card_expiry_date,
                disabilityMarks: markRows.map((m) => m.mark_code && m.mark_code.trim()),
                role: req.session.role,
                visibleUserId: req.session.visibleUserId,
                hasRoleAppointingCapability: canAppoint,
                hasDisabilityApprovalAccess: req.session.hasDisabilityApprovalAccess,
                hasAccountManagementAccess: req.session.hasAccountManagementAccess,
                hasCreationAccess: req.session.hasCreationAccess,
                hasEditingAccess: req.session.hasEditingAccess,
                hasDeletionPermission: req.session.hasDeletionPermission,
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

// Liefert die in der Nutzertabelle hinterlegte Standardadresse
app.get('/user-address', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        const { rows } = await client.query(
            `SELECT salutation, first_name, last_name, company, street_address, postal_code, city, country
             FROM users WHERE user_id = $1`,
            [req.session.userId]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ address: rows[0] });
    } catch (err) {
        console.error('Error fetching user address:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert alle offenen Anträge auf Nachteilsausgleich
app.get('/pending-disability-requests', async (req, res) => {
    try {
        const { rows } = await client.query(
            `SELECT user_id, visible_user_id, birth_date, updated_at
               FROM users
              WHERE is_currently_disabled = false
                AND request_for_disability = true
              ORDER BY updated_at DESC`
        );
        return res.json({ requests: rows });
    } catch (err) {
        console.error('Error fetching pending disability requests:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert akzeptierte Anträge der letzten 30 Tage
app.get('/accepted-disability-requests', async (req, res) => {
    try {
        const { rows } = await client.query(
            `SELECT user_id, visible_user_id, birth_date, updated_at
               FROM users
              WHERE is_currently_disabled = true
                AND request_for_disability = true
                AND updated_at >= NOW() - interval '30 days'
              ORDER BY updated_at DESC`
        );
        return res.json({ requests: rows });
    } catch (err) {
        console.error('Error fetching accepted disability requests:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert die hinterlegten Disability-Daten eines Users
app.get('/users/:id/disability', async (req, res) => {
    const userId = req.params.id;
    try {
        const { rows } = await client.query(
            `SELECT salutation, first_name, last_name,
                    disability_degree, disability_card_expiry_date,
                    disability_card_image_front, disability_card_image_back
               FROM users
              WHERE user_id = $1
              LIMIT 1`,
            [userId]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];
        const { rows: markRows } = await client.query(
            'SELECT mark_code FROM user_disability_marks WHERE user_id = $1',
            [userId]
        );
        return res.json({
            disabilityData: {
                disability_degree: user.disability_degree,
                disability_card_expiry_date: user.disability_card_expiry_date,
                disability_card_image_front: user.disability_card_image_front,
                disability_card_image_back: user.disability_card_image_back,
                marks: markRows.map((m) => m.mark_code && m.mark_code.trim()),
            },
            user: {
                salutation: user.salutation,
                firstName: user.first_name,
                lastName: user.last_name,
            },
        });
    } catch (err) {
        console.error('Error fetching disability data:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Accept a disability request
app.post('/disability-requests/:id/accept', async (req, res) => {
    const userId = req.params.id;
    try {
        await client.query(
            `UPDATE users
                SET is_currently_disabled = true,
                    updated_at = NOW()
              WHERE user_id = $1`,
            [userId]
        );
        return res.json({ message: 'Request accepted' });
    } catch (err) {
        console.error('Error accepting disability request:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Decline a disability request
app.post('/disability-requests/:id/decline', async (req, res) => {
    const userId = req.params.id;
    try {
        await client.query(
            `UPDATE users
                SET request_for_disability = false,
                    updated_at = NOW()
              WHERE user_id = $1`,
            [userId]
        );
        return res.json({ message: 'Request declined' });
    } catch (err) {
        console.error('Error declining disability request:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Temporäres Speichern der Versandinformationen in der Session (wird später in der DB gespeichert)
app.post('/checkout-shipping', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    if (!req.session.checkout) {
        return res.status(400).json({ message: 'No active checkout' });
    }

    if (Date.now() - req.session.checkout.startedAt > 15 * 60 * 1000) {
        req.session.checkout = null;
        return res.status(400).json({ message: 'Checkout expired' });
    }

    req.session.checkout.shippingInfo = req.body || {};
    return res.status(200).json({ message: 'OK' });
});

// Liefert die aktuell in der Checkout-Session gespeicherten Lieferinformationen
app.get('/checkout-shipping', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    if (!req.session.checkout) {
        return res.status(404).json({ message: 'No active checkout' });
    }

    if (Date.now() - req.session.checkout.startedAt > 15 * 60 * 1000) {
        req.session.checkout = null;
        return res.status(404).json({ message: 'Checkout expired' });
    }

    return res.json({ shippingInfo: req.session.checkout.shippingInfo || null });
});
// Temporäres Speichern der Zahlungsart in der Session
app.post('/checkout-payment', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    if (!req.session.checkout) {
        return res.status(400).json({ message: 'No active checkout' });
    }

    if (Date.now() - req.session.checkout.startedAt > 15 * 60 * 1000) {
        req.session.checkout = null;
        return res.status(400).json({ message: 'Checkout expired' });
    }

    req.session.checkout.paymentMethod = req.body.paymentMethod || null;
    return res.status(200).json({ message: 'OK' });
});

// Liefert die aktuell gespeicherte Zahlungsart
app.get('/checkout-payment', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    if (!req.session.checkout) {
        return res.status(404).json({ message: 'No active checkout' });
    }

    if (Date.now() - req.session.checkout.startedAt > 15 * 60 * 1000) {
        req.session.checkout = null;
        return res.status(404).json({ message: 'Checkout expired' });
    }

    return res.json({ paymentMethod: req.session.checkout.paymentMethod || null });
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

// PUT: update country incl. its cities
app.put('/countries/:id', async (req, res) => {
    const countryId = req.params.id;
    const { name, code, cities = [] } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name ist erforderlich' });
    }

    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE countries
                 SET name = $1,
                     iso_code = $2
               WHERE id = $3`,
            [name.trim(), code ? code.trim().toUpperCase() : null, countryId]
        );

        const { rows: existing } = await client.query(
            'SELECT id FROM cities WHERE country_id = $1',
            [countryId]
        );
        const remaining = new Set(existing.map(r => r.id));

        for (const c of cities) {
            if (c.id && remaining.has(c.id)) {
                await client.query(
                    'UPDATE cities SET name = $1 WHERE id = $2',
                    [c.name.trim(), c.id]
                );
                remaining.delete(c.id);
            } else if (!c.id) {
                await client.query(
                    'INSERT INTO cities (id, name, country_id) VALUES ($1, $2, $3)',
                    [uuidv4(), c.name.trim(), countryId]
                );
            }
        }

        for (const delId of remaining) {
            await client.query('DELETE FROM cities WHERE id = $1', [delId]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Land aktualisiert' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update-country error:', err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Landes' });
    }
});

// DELETE: remove country and its cities
app.delete('/countries/:id', async (req, res) => {
    const countryId = req.params.id;
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM cities WHERE country_id = $1', [countryId]);
        await client.query('DELETE FROM countries WHERE id = $1', [countryId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Land gelöscht' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete-country error:', err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Landes' });
    }
});

app.get('/email-exists', async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: 'Email erforderlich' });
    try {
        const { rows } = await client.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email.trim()]);
        return res.json({ exists: rows.length > 0 });
    } catch (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------- Admin: User Management ----------
// Liefert alle Rollen
app.get('/user-roles', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT id, name FROM user_roles ORDER BY name');
        return res.json({ roles: rows });
    } catch (err) {
        console.error('Error fetching user roles:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert alle Nutzer, optional gefiltert nach Rolle
app.get('/users', async (req, res) => {
    const roleId = req.query.roleId;
    const params = [];
    let where = '';
    if (roleId) {
        params.push(roleId);
        where = 'WHERE u.role = $1';
    }
    try {
        const { rows } = await client.query(
            `SELECT u.user_id,
                    u.visible_user_id,
                    u.created_at,
                    u.role,
                    ur.name AS role_name,
                    COUNT(o.id) AS order_count
             FROM users u
                  JOIN user_roles ur ON ur.id = u.role
                  LEFT JOIN orders o ON o.user_id = u.user_id
             ${where}
             GROUP BY u.user_id, u.visible_user_id, u.created_at, u.role, ur.name
             ORDER BY u.created_at DESC`,
            params
        );
        return res.json({ users: rows });
    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Detaildaten eines Nutzers inkl. Rolle und Disability Info
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const { rows } = await client.query(
            `SELECT u.*, ur.name AS role_name
               FROM users u
               JOIN user_roles ur ON ur.id = u.role
              WHERE u.user_id = $1
              LIMIT 1`,
            [userId]
        );
        if (!rows.length) return res.status(404).json({ message: 'User not found' });

        const user = rows[0];
        const { rows: marks } = await client.query(
            'SELECT mark_code FROM user_disability_marks WHERE user_id = $1',
            [userId]
        );
        return res.json({
            user: {
                ...user,
                marks: marks.map(m => m.mark_code && m.mark_code.trim()),
            },
        });
    } catch (err) {
        console.error('Error fetching user detail:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Bestellungen eines bestimmten Nutzers (Admin)
app.get('/users/:id/orders', async (req, res) => {
    const userId = req.params.id;
    try {
        const { rows } = await client.query(
            `SELECT o.id,
                    o.created_at,
                    o.street_address,
                    o.postal_code,
                    o.city,
                    o.country,
                    COUNT(ot.ticket_id) AS ticket_count
               FROM orders o
                    LEFT JOIN order_tickets ot ON ot.order_id = o.id
              WHERE o.user_id = $1
              GROUP BY o.id, o.created_at
              ORDER BY o.created_at DESC`,
            [userId]
        );
        return res.json({ orders: rows });
    } catch (err) {
        console.error('Error fetching user orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Rolle eines Nutzers aktualisieren
app.put('/users/:id/role', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.params.id;
    const { roleId } = req.body;

    if (!roleId) {
        return res.status(400).json({ message: 'roleId required' });
    }

    try {
        const { rows: permRows } = await client.query(
            'SELECT has_role_appointing_capability FROM user_roles WHERE id = $1',
            [req.session.role]
        );

        if (!permRows.length || !permRows[0].has_role_appointing_capability) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await client.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE user_id = $2',
            [roleId, userId]
        );

        const { rows } = await client.query(
            `SELECT u.user_id,
                    u.visible_user_id,
                    u.created_at,
                    u.role,
                    ur.name AS role_name
               FROM users u
                    JOIN user_roles ur ON ur.id = u.role
              WHERE u.user_id = $1`,
            [userId]
        );

        return res.json({ user: rows[0] });
    } catch (err) {
        console.error('Error updating user role:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PATCH: update user profile (allgemeine Profildaten)
app.patch('/users/:id', async (req, res) => {
    const sessionUserId = req.session.userId;
    const paramUserId   = req.params.id;

    // 1) Nur eigene Daten dürfen geändert werden
    if (!sessionUserId) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    if (sessionUserId !== paramUserId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // 2) Felder aus dem Body entnehmen
    const {
        salutation,
        firstName,
        lastName,
        email,
        company,
        streetAddress,
        postalCode,
        city,
        country,
        birthDate,
        phone
    } = req.body;

    // 3) Pflichtfelder validieren (beispielhaft: Vor- und Nachname und E-Mail)
    if (!firstName || !lastName || !email) {
        return res.status(400).json({
            message: 'firstName, lastName und email sind erforderlich'
        });
    }

    try {
        // 4) Update-Query
        const { rows } = await client.query(
            `
        UPDATE users
           SET salutation                   = $1,
               first_name                   = $2,
               last_name                    = $3,
               email                        = $4,
               company                      = $5,
               street_address               = $6,
               postal_code                  = $7,
               city                         = $8,
               country                      = $9,
               birth_date                   = $10,
               phone                        = $11,
               updated_at                   = NOW()
         WHERE user_id = $12
         RETURNING user_id,
                   salutation     AS "salutation",
                   first_name     AS "firstName",
                   last_name      AS "lastName",
                   email          AS "email",
                   company        AS "company",
                   street_address AS "streetAddress",
                   postal_code    AS "postalCode",
                   city           AS "city",
                   country        AS "country",
                   birth_date     AS "birthDate",
                   phone          AS "phone"
      `,
            [
                salutation || null,
                firstName.trim(),
                lastName.trim(),
                email.trim(),
                company || null,
                streetAddress || null,
                postalCode || null,
                city || null,
                country || null,
                birthDate || null,
                phone || null,
                sessionUserId
            ]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User nicht gefunden' });
        }

        // 5) Erfolgreiche Antwort mit den neuen Profildaten
        return res.status(200).json({
            message: 'Profil erfolgreich aktualisiert',
            user: rows[0]
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Profils' });
    }
});


// Passwort eines Nutzers ändern
app.patch('/users/:id/password', async (req, res) => {
    const sessionUser = req.session.userId;
    if (!sessionUser) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.params.id;
    if (sessionUser !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword required' });
    }

    try {
        const { rows } = await client.query(
            'SELECT password FROM users WHERE user_id = $1',
            [userId]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        const match = await bcrypt.compare(currentPassword, rows[0].password);
        if (!match) {
            return res.status(400).json({ message: 'Aktuelles Passwort stimmt nicht' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'Passwörter sind identisch' });
        }
        const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        if (!pattern.test(newPassword)) {
            return res.status(400).json({ message: 'Anforderungen für ein Passwort nicht erfüllt' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await client.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2',
            [hashed, userId]
        );

        return res.json({ message: 'Passwort aktualisiert' });
    } catch (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Passworts' });
    }
});

// PATCH: update user profile by admin/support
app.patch('/users/:id/management', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        const { rows: permRows } = await client.query(
            'SELECT has_account_management_access FROM user_roles WHERE id = $1',
            [req.session.role]
        );
        if (!permRows.length || !permRows[0].has_account_management_access) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const userId = req.params.id;
        const {
            salutation,
            firstName,
            lastName,
            birthDate,
            disabilityDegree,
            disabilityCardExpiryDate,
            marks = [],
        } = req.body;

        await client.query('BEGIN');

        const { rows } = await client.query(
            `UPDATE users
                SET salutation = $1,
                    first_name = $2,
                    last_name = $3,
                    birth_date = $4,
                    disability_degree = $5,
                    disability_card_expiry_date = $6,
                    updated_at = NOW()
             WHERE user_id = $7
             RETURNING user_id,
                       salutation AS "salutation",
                       first_name AS "firstName",
                       last_name AS "lastName",
                       birth_date AS "birthDate",
                       disability_degree AS "disabilityDegree",
                       disability_card_expiry_date AS "disabilityCardExpiryDate"`,
            [
                salutation || null,
                firstName?.trim() || '',
                lastName?.trim() || '',
                birthDate || null,
                disabilityDegree || null,
                disabilityCardExpiryDate || null,
                userId,
            ]
        );

        await client.query('DELETE FROM user_disability_marks WHERE user_id = $1', [userId]);
        if (Array.isArray(marks)) {
            for (const m of marks) {
                await client.query(
                    'INSERT INTO user_disability_marks (user_id, mark_code) VALUES ($1, $2)',
                    [userId, m]
                );
            }
        }

        const { rows: markRows } = await client.query(
            'SELECT mark_code FROM user_disability_marks WHERE user_id = $1',
            [userId]
        );

        await client.query('COMMIT');

        const updated = rows[0];
        return res.json({
            user: {
                ...updated,
                marks: markRows.map((m) => m.mark_code && m.mark_code.trim()),
            },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating user via management:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert alle verfügbaren Versandoptionen
app.get('/shipping-options', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, label, price, description FROM shipping_options ORDER BY price'
        );
        res.status(200).json({ options: result.rows });
    } catch (error) {
        console.error('Error fetching shipping options:', error);
        res.status(500).json({ message: 'Serverfehler beim Laden der Versandoptionen' });
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
        if (error.code === '23505' && error.constraint === 'unique_artist_name') {
            return res.status(409).json({ message: 'Künstler mit diesem Namen existiert bereits.' });
        }
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

app.get('/artist-details/:id', async (req, res) => {
    const artistId = req.params.id;
    try {
        const { rows } = await client.query(
            `SELECT a.id,
                    a.name,
                    a.biography,
                    a.website,
                    a.artist_image,
                    COUNT(DISTINCT ta.tour_id) AS "tourCount"
             FROM artists a
             LEFT JOIN tour_artists ta ON ta.artist_id = a.id
             WHERE a.id = $1
             GROUP BY a.id, a.name, a.biography, a.website, a.artist_image`,
            [artistId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Artist nicht gefunden' });
        }
        return res.status(200).json({ artist: rows[0] });
    } catch (err) {
        console.error('Error in /artist-details:', err);
        return res.status(500).json({ message: 'Fehler beim Laden des Künstlers' });
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
        if (error.code === '23505' && error.constraint === 'unique_tour_title_dates') {
            return res.status(409).json({ message: 'Eine Tour mit diesen Daten existiert bereits.' });
        }
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
        if (error.code === '23505' && error.constraint === 'unique_city_name_per_country') {
            return res.status(409).json({ message: 'Stadt existiert bereits in diesem Land.' });
        }
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
app.post('/create-venue', upload.single('venueImage'), async (req, res) => {
    const {
        name,
        address,
        cityId,
        website,
        venueAreas = [],
    } = req.body;

    let areas = [];
    try {
        areas = typeof venueAreas === 'string' ? JSON.parse(venueAreas) : venueAreas;
        if (!Array.isArray(areas)) areas = [];
    } catch {
        areas = [];
    }

    if (!name?.trim() || !address?.trim() || !cityId) {
        return res.status(400).json({
            message: 'Name, Adresse und Stadt sind erforderlich'
        });
    }

    try {
        await client.query('BEGIN');
        const venueId = uuidv4();

        let imageId = null;
        if (req.file) {
            imageId = uuidv4();
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)',
                [imageId, req.file.buffer, req.file.mimetype, 'venue', venueId]
            );
        }

        const { rows } = await client.query(
            `INSERT INTO venues
                 (id, name, address, city_id, website, venue_image)
             VALUES ($1,$2,$3,$4,$5,$6)
             RETURNING *`,
            [venueId, name.trim(), address.trim(), cityId, website || null, imageId]
        );

        for (const va of areas) {
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
    const result = await client.query('SELECT id, name, venue_image FROM venues ORDER BY name');
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
                    v.venue_image,
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

// PUT: Update a venue, its areas and optionally the image
app.put('/venues/:id', upload.single('venue_image'), async (req, res) => {
    const venueId = req.params.id;
    const { name, address, cityId, website } = req.body;
    let venueAreas = [];
    try {
        venueAreas = req.body.venueAreas
            ? JSON.parse(req.body.venueAreas)
            : [];
        if (!Array.isArray(venueAreas)) venueAreas = [];
    } catch {
        venueAreas = [];
    }

    if (!name?.trim() || !address?.trim() || !cityId) {
        return res
            .status(400)
            .json({ message: 'Name, Adresse und Stadt sind erforderlich' });
    }

    try {
        await client.query('BEGIN');

        // Aktuelles Bild ermitteln
        const { rows: existingVenue } = await client.query(
            'SELECT venue_image FROM venues WHERE id = $1',
            [venueId]
        );
        if (existingVenue.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Venue nicht gefunden' });
        }
        const oldImageId = existingVenue[0].venue_image;

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

        if (req.file) {
            const newImageId = uuidv4();
            await client.query(
                'INSERT INTO images (id, image_data, image_type, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)',
                [newImageId, req.file.buffer, req.file.mimetype, 'venue', venueId]
            );
            await client.query('UPDATE venues SET venue_image = $1 WHERE id = $2', [newImageId, venueId]);
            if (oldImageId) {
                await client.query('DELETE FROM images WHERE id = $1', [oldImageId]);
            }
        }

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
        if (err.code === '23505' && err.constraint === 'unique_event_start_per_venue') {
            return res.status(409).json({ message: 'In diesem Zeitraum besteht bereits ein Event an diesem Veranstaltungsort.' });
        }
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
        if (err.code === '23505' && err.constraint === 'unique_genre_name') {
            return res.status(409).json({ message: 'Genre existiert bereits.' });
        }
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Genres' });
    }
});

// PUT: update a genre and its subgenres
app.put('/genres/:id', async (req, res) => {
    const genreId = req.params.id;
    const { name, subgenres = [] } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name ist erforderlich' });
    }

    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE genres SET name = $1 WHERE id = $2',
            [name.trim(), genreId]
        );

        const { rows: existing } = await client.query(
            'SELECT id FROM subgenres WHERE genre_id = $1',
            [genreId]
        );
        const remaining = new Set(existing.map(r => r.id));

        for (const sg of subgenres) {
            if (sg.id && remaining.has(sg.id)) {
                await client.query(
                    'UPDATE subgenres SET name = $1 WHERE id = $2',
                    [sg.name.trim(), sg.id]
                );
                remaining.delete(sg.id);
            } else if (!sg.id) {
                await client.query(
                    'INSERT INTO subgenres (id, genre_id, name) VALUES ($1, $2, $3)',
                    [uuidv4(), genreId, sg.name.trim()]
                );
            }
        }

        for (const delId of remaining) {
            await client.query('DELETE FROM subgenres WHERE id = $1', [delId]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Genre aktualisiert' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update-genre error:', err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Genres' });
    }
});

// DELETE: remove a genre completely
app.delete('/genres/:id', async (req, res) => {
    const genreId = req.params.id;
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM subgenres WHERE genre_id = $1', [genreId]);
        await client.query('DELETE FROM genres WHERE id = $1', [genreId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Genre gelöscht' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete-genre error:', err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Genres' });
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
              'name', s.name,
              'event_count', COALESCE(ec.event_count, 0)
            )
            ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS subgenres
      FROM genres g
      LEFT JOIN subgenres s
        ON s.genre_id = g.id
      LEFT JOIN (
        SELECT ts.subgenre_id, COUNT(e.id) AS event_count
        FROM tour_subgenres ts
        JOIN events e ON e.tour_id = ts.tour_id
        GROUP BY ts.subgenre_id
      ) ec ON ec.subgenre_id = s.id
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

app.get('/countries-with-cities', async (req, res) => {
    try {
        const { rows } = await client.query(`
      SELECT
        co.id AS country_id,
        co.name AS country_name,
        co.iso_code      AS iso_code,
        COALESCE(
          json_agg(
            json_build_object('id', ci.id, 'name', ci.name)
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'
        ) AS cities
      FROM countries co
      LEFT JOIN cities ci ON ci.country_id = co.id
      GROUP BY co.id, co.name, co.iso_code
      ORDER BY co.name
    `);

        const countriesWithCities = rows.map(r => ({
            id: r.country_id,
            name: r.country_name,
            iso_code: r.iso_code,
            cities: r.cities,
        }));

        return res.status(200).json({ countries: countriesWithCities });
    } catch (error) {
        console.error('Error fetching countries with cities:', error);
        return res.status(500).json({ message: 'Fehler beim Laden der Länder und Städte' });
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
              'name', v.name,
              'venue_image', v.venue_image,
              'event_count', COALESCE(ev.event_count, 0)
            )
            ORDER BY v.name
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) AS venues
      FROM cities ci
      LEFT JOIN venues v
        ON v.city_id = ci.id
      LEFT JOIN (
        SELECT venue_id, COUNT(id) AS event_count
        FROM events
        GROUP BY venue_id
      ) ev ON ev.venue_id = v.id
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
            `
                SELECT DISTINCT ON (t.id)
                    t.id,
                    t.title,
                    t.tour_image,
                    ta.artist_id
                FROM tours AS t
                     JOIN tour_artists AS ta ON ta.tour_id = t.id
                WHERE EXISTS (
                    SELECT 1 FROM events e WHERE e.tour_id = t.id
                )
                ORDER BY
                    t.id,
                    ta.artist_id;
            `
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
            `
                SELECT DISTINCT a.id, a.name, a.artist_image
                FROM artists a
                     JOIN tour_artists ta ON ta.artist_id = a.id
                WHERE EXISTS (
                    SELECT 1 FROM events e WHERE e.tour_id = ta.tour_id
                )
                ORDER BY a.name
            `
        );
        res.status(200).json({ artists: rows });
    } catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({ message: "Fehler beim Laden der Künstler" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suche nach Touren (inkl. 2 nächster Events) mit einfacher Cache-Schicht
// ─────────────────────────────────────────────────────────────────────────────
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
let toursSearchCache = { data: null, timestamp: 0 };

async function loadToursSearchCache() {
    const { rows } = await client.query(
        `SELECT *
         FROM (
             SELECT
                 t.id            AS tour_id,
                 t.title         AS tour_title,
                 t.tour_image    AS tour_image,
                 ta.artist_id    AS artist_id,
                 e.id            AS event_id,
                 e.start_time    AS start_time,
                 v.name          AS venue_name,
                 c.name          AS city_name,
                 ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY e.start_time) AS rn
             FROM tours t
                  JOIN tour_artists ta ON ta.tour_id = t.id
                  LEFT JOIN events e      ON e.tour_id = t.id
                  LEFT JOIN venues v      ON v.id = e.venue_id
                  LEFT JOIN cities c      ON c.id = v.city_id
         ) sub
         WHERE sub.event_id IS NOT NULL
         ORDER BY sub.tour_title, sub.rn;`
    );

    const map = {};
    rows.forEach((r) => {
        if (!map[r.tour_id]) {
            map[r.tour_id] = {
                id: r.tour_id,
                title: r.tour_title,
                tour_image: r.tour_image,
                artist_id: r.artist_id,
                events: [],
            };
        }
        if (r.event_id) {
            map[r.tour_id].events.push({
                id: r.event_id,
                start_time: r.start_time,
                venueName: r.venue_name,
                cityName: r.city_name,
            });
        }
    });

    toursSearchCache = { data: Object.values(map), timestamp: Date.now() };
}

app.get('/search-tours', async (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    if (!toursSearchCache.data || Date.now() - toursSearchCache.timestamp > SEARCH_CACHE_TTL) {
        try {
            await loadToursSearchCache();
        } catch (err) {
            console.error('Error loading search cache:', err);
            return res.status(500).json({ message: 'Fehler beim Laden der Suchdaten' });
        }
    }

    const result = toursSearchCache.data.filter((t) =>
        t.title.toLowerCase().includes(query)
    );
    res.json({ tours: result.slice(0, 10) });
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

// app.delete('/artists/:id', async (req, res) => {
//     const artistId = req.params.id;
//     try {
//         // 1) hole artist_image id
//         const { rows } = await client.query(
//             'SELECT artist_image FROM artists WHERE id = $1',
//             [artistId]
//         );
//         if (rows.length === 0) {
//             return res.status(404).json({ message: 'Artist nicht gefunden' });
//         }
//         const imageId = rows[0].artist_image;
//
//         // 2) lösche Künstler
//         await client.query('DELETE FROM artists WHERE id = $1', [artistId]);
//
//         // 3) lösche zugehöriges Bild, falls vorhanden
//         if (imageId) {
//             await client.query('DELETE FROM images WHERE id = $1', [imageId]);
//         }
//
//         return res.status(200).json({ message: 'Artist gelöscht' });
//     } catch (err) {
//         console.error('Delete-Artist error:', err);
//         return res.status(500).json({ message: 'Serverfehler beim Löschen des Künstlers' });
//     }
// });

// … ganz oben: express, client etc. importieren …

// server.js (vollständiger Endpoint)

app.get('/tours-detailed', async (req, res) => {
    try {
        const marks = (req.query.marks || '')
            .split(',')
            .map((m) => m.trim())
            .filter((m) => m.length > 0);
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

        // 1) Alle Tours holen (optional nach Disability-Marks gefiltert)
        const tourQueryBase = `
            SELECT
                t.id,
                t.title,
                t.subtitle,
                t.start_date,
                t.end_date,
                t.tour_image
            FROM tours t`;
        const filterClause = marks.length > 0 ? `
            WHERE EXISTS (
                SELECT 1
                FROM events e
                    JOIN event_categories ec ON ec.event_id = e.id
                WHERE e.tour_id = t.id
                  AND ec.disability_support_for = ANY($1::text[])
            )` : '';
        const tourQuery = `${tourQueryBase} ${filterClause} ORDER BY t.start_date;`;
        const { rows: tourRows } = await client.query(tourQuery, marks.length > 0 ? [marks] : []);

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
                          AND ec.disability_support_for IS NULL
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
                        SELECT a.id, a.name
                        FROM tour_artists ta
                                 JOIN artists a ON a.id = ta.artist_id
                        WHERE ta.tour_id = $1
                        ORDER BY a.name
                    `,
                    [tour.id]
                );
                const artistsList = artistRows.map((r) => r.name);
                const artistIds = artistRows.map((r) => r.id);

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
                    artistIds,
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
        await client.query('BEGIN');

        const { rows } = await client.query(
            'SELECT tour_image FROM tours WHERE id = $1',
            [tourId]
        );
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Tour nicht gefunden' });
        }
        const imageId = rows[0].tour_image;

        const { rows: eventRows } = await client.query(
            'SELECT id FROM events WHERE tour_id = $1',
            [tourId]
        );

        for (const ev of eventRows) {
            const { rows: t } = await client.query(
                `SELECT 1
                   FROM tickets t
                        JOIN event_categories ec ON ec.id = t.event_category_id
                  WHERE ec.event_id = $1
                  LIMIT 1`,
                [ev.id]
            );
            if (t.length > 0) {
                await client.query('ROLLBACK');
                return res
                    .status(400)
                    .json({ message: 'Tour kann nicht gelöscht werden, da Tickets für Events existieren.' });
            }
        }

        for (const ev of eventRows) {
            await client.query('DELETE FROM cart_items WHERE event_id = $1', [ev.id]);
            await client.query('DELETE FROM checkout_items WHERE event_id = $1', [ev.id]);
            await client.query(
                `DELETE FROM order_tickets ot
                 USING tickets t, event_categories ec
                 WHERE ot.ticket_id = t.id
                   AND t.event_category_id = ec.id
                   AND ec.event_id = $1`,
                [ev.id]
            );
            await client.query(
                `DELETE FROM tickets t
                 USING event_categories ec
                 WHERE t.event_category_id = ec.id
                   AND ec.event_id = $1`,
                [ev.id]
            );
            await client.query(
                `DELETE FROM event_venue_areas eva
                 USING event_categories ec
                 WHERE eva.category_id = ec.id
                   AND ec.event_id = $1`,
                [ev.id]
            );
            await client.query('DELETE FROM event_supporting_acts WHERE event_id = $1', [ev.id]);
            await client.query('DELETE FROM event_categories WHERE event_id = $1', [ev.id]);
            await client.query('DELETE FROM events WHERE id = $1', [ev.id]);
        }

        await client.query('DELETE FROM tour_artists WHERE tour_id = $1', [tourId]);
        await client.query('DELETE FROM tour_subgenres WHERE tour_id = $1', [tourId]);
        await client.query('DELETE FROM tour_genres WHERE tour_id = $1', [tourId]);

        await client.query('DELETE FROM tours WHERE id = $1', [tourId]);
        if (imageId) {
            await client.query('DELETE FROM images WHERE id = $1', [imageId]);
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Tour gelöscht' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete‐Tour error:', err);
        if (err.code === 'P0001') {
            return res.status(400).json({ message: err.message });
        }
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

// Liefert Detailinformationen zu einer Tour inklusive aller Events
app.get('/tour-details/:id', async (req, res) => {
    const tourId = req.params.id;
    try {
        const { rows: tourRows } = await client.query(
            `SELECT id, title, subtitle, start_date, end_date, tour_image
             FROM tours WHERE id = $1`,
            [tourId]
        );
        if (tourRows.length === 0) {
            return res.status(404).json({ message: 'Tour nicht gefunden' });
        }

        const tour = tourRows[0];

        const { rows: countRows } = await client.query(
            `SELECT COUNT(*) AS "eventCount" FROM events WHERE tour_id = $1`,
            [tourId]
        );
        const eventCount = parseInt(countRows[0].eventCount, 10);

        const { rows: cheapestRows } = await client.query(
            `SELECT MIN(ec.price)::numeric(10,2) AS "cheapestPrice"
               FROM event_categories ec
                    JOIN events e ON e.id = ec.event_id
              WHERE e.tour_id = $1
                AND ec.disability_support_for IS NULL`,
            [tourId]
        );
        const cheapestPrice = cheapestRows[0].cheapestPrice !== null
            ? parseFloat(cheapestRows[0].cheapestPrice)
            : null;

        const { rows: allMarks } = await client.query(
            `SELECT area_id, mark_code FROM disability_marks WHERE area_id IS NOT NULL`
        );
        const marksMap = {};
        allMarks.forEach((row) => {
            const aid = row.area_id;
            const code = row.mark_code.trim();
            if (!marksMap[aid]) marksMap[aid] = [];
            if (!marksMap[aid].includes(code)) marksMap[aid].push(code);
        });

        const { rows: baseEvents } = await client.query(
            `SELECT e.id,
                    e.description,
                    e.start_time,
                    e.end_time,
                    e.door_time,
                    v.name AS "venueName",
                    c.name AS "cityName"
               FROM events e
                    JOIN venues v ON v.id = e.venue_id
                    JOIN cities c ON c.id = v.city_id
              WHERE e.tour_id = $1
              ORDER BY e.start_time`,
            [tourId]
        );

        const events = await Promise.all(
            baseEvents.map(async (ev) => {
                const { rows: evaRows } = await client.query(
                    `SELECT venue_area_id FROM event_venue_areas WHERE event_id = $1`,
                    [ev.id]
                );
                const areaIds = [];
                for (const eva of evaRows) {
                    const { rows: vaRows } = await client.query(
                        `SELECT area_id FROM venue_areas WHERE id = $1`,
                        [eva.venue_area_id]
                    );
                    if (vaRows[0] && vaRows[0].area_id) areaIds.push(vaRows[0].area_id);
                }
                const collectedCodes = new Set();
                areaIds.forEach((aid) => {
                    if (marksMap[aid]) {
                        marksMap[aid].forEach((c) => collectedCodes.add(c));
                    }
                });
                const labels = Array.from(collectedCodes)
                    .map((code) => {
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
                    })
                    .filter((l) => l !== null);
                return {
                    id: ev.id,
                    description: ev.description,
                    cityName: ev.cityName,
                    venueName: ev.venueName,
                    start_time: ev.start_time,
                    end_time: ev.end_time,
                    door_time: ev.door_time,
                    accessibility: Array.from(new Set(labels)),
                };
            })
        );

        const { rows: artistRows } = await client.query(
            `SELECT a.id, a.name
               FROM tour_artists ta
                    JOIN artists a ON a.id = ta.artist_id
              WHERE ta.tour_id = $1
              ORDER BY a.name`,
            [tourId]
        );
        const artistsList = artistRows.map((r) => r.name);
        const artistIds = artistRows.map((r) => r.id);

        const { rows: genreRows } = await client.query(
            `SELECT g.id AS "genreId",
                    g.name AS "genreName",
                    COALESCE(json_agg(s.name) FILTER (WHERE s.id IS NOT NULL), '[]') AS "subgenreNames"
               FROM tour_genres tg
                    JOIN genres g ON g.id = tg.genre_id
                    LEFT JOIN tour_subgenres ts ON ts.tour_id = tg.tour_id
                    LEFT JOIN subgenres s ON s.id = ts.subgenre_id AND s.genre_id = tg.genre_id
              WHERE tg.tour_id = $1
              GROUP BY g.id, g.name
              ORDER BY g.name`,
            [tourId]
        );
        const genresWithSubs = genreRows.map((r) => ({
            genreId: r.genreid,
            genreName: r.genrename,
            subgenreNames: r.subgenrenames || [],
        }));

        return res.status(200).json({
            tour: {
                id: tour.id,
                title: tour.title,
                subtitle: tour.subtitle,
                start_date: tour.start_date,
                end_date: tour.end_date,
                tour_image: tour.tour_image,
                eventCount,
                cheapestPrice,
                artistsList,
                artistIds,
                genresWithSubs,
                events,
            },
        });
    } catch (err) {
        console.error('Error in /tour-details:', err);
        return res.status(500).json({ message: 'Fehler beim Laden der Tour' });
    }
});

// Liefert Detailinformationen zu einem Event inklusive Kategorien und zugehörigen Künstler-IDs
app.get('/event-details/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const { rows } = await client.query(
            `SELECT
                e.id,
                e.tour_id,
                e.venue_id,
                e.description,
                e.start_time,
                e.end_time,
                e.door_time,
                v.name  AS "venueName",
                c.name  AS "cityName",
                t.title AS "tourTitle",
                t.tour_image AS "tourImage"
             FROM events e
                JOIN tours t   ON t.id = e.tour_id
                JOIN venues v  ON v.id = e.venue_id
                JOIN cities c  ON c.id = v.city_id
             WHERE e.id = $1`,
            [eventId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Event nicht gefunden' });
        }
        const event = rows[0];

        const { rows: artistRows } = await client.query(
            'SELECT artist_id FROM tour_artists WHERE tour_id = $1',
            [event.tour_id]
        );
        const artistIds = artistRows.map((r) => r.artist_id);

        const { rows: catRows } = await client.query(
            `SELECT
                 ec.id,
                 ec.name,
                 ec.price,
                 ec.disability_support_for,
                 ARRAY_REMOVE(ARRAY_AGG(a.name ORDER BY a.name), NULL) AS venue_area_names,
                 MIN(a.description) AS area_description
             FROM event_categories ec
                  LEFT JOIN event_venue_areas eva ON eva.category_id = ec.id
                  LEFT JOIN venue_areas va ON va.id = eva.venue_area_id
                  LEFT JOIN areas a ON a.id = va.area_id
             WHERE ec.event_id = $1
             GROUP BY ec.id, ec.name, ec.price, ec.disability_support_for
             ORDER BY ec.name`,
            [eventId]
        );

        const categories = catRows.map((c) => ({
            ...c,
            price: c.price !== null ? parseFloat(c.price) : null,
            venue_area_names: c.venue_area_names || [],
            area_description: c.area_description || null,
        }));

        return res.status(200).json({ event, categories, artistIds });
    } catch (err) {
        console.error('Error in /event-details:', err);
        return res.status(500).json({ message: 'Fehler beim Laden des Events' });
    }
});

// Liefert verbleibende Kapazitäten pro Kategorie eines Events
app.get('/event-capacities/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const { rows: catRows } = await client.query(
            `SELECT ec.id,
                    ec.disability_support_for,
                    COALESCE(SUM(eva.capacity),0) AS capacity
             FROM event_categories ec
                  LEFT JOIN event_venue_areas eva ON eva.category_id = ec.id
             WHERE ec.event_id = $1
             GROUP BY ec.id, ec.disability_support_for`,
            [eventId]
        );

        const categories = [];
        for (const r of catRows) {
            const { rows: soldRows } = await client.query(
                'SELECT COUNT(*) AS sold FROM tickets WHERE event_category_id = $1',
                [r.id]
            );
            const sold = parseInt(soldRows[0].sold, 10) || 0;
            const capacity = parseInt(r.capacity, 10) || 0;
            categories.push({
                id: r.id,
                disability_support_for: r.disability_support_for,
                capacity,
                remaining: capacity - sold,
            });
        }

        const totalCapacity = categories.reduce((s, c) => s + c.capacity, 0);
        const totalRemaining = categories.reduce((s, c) => s + c.remaining, 0);

        return res.json({ eventId, totalCapacity, totalRemaining, categories });
    } catch (err) {
        console.error('Error in /event-capacities:', err);
        return res.status(500).json({ message: 'Fehler beim Laden der Kapazität' });
    }
});

// PUT /events/:id – aktualisiert die Basisdaten eines Events
app.put('/events/:id', async (req, res) => {
    const eventId = req.params.id;
    const { venueId, doorTime, startTime, endTime, description } = req.body;

    try {
        await client.query(
            `UPDATE events
                 SET venue_id   = $1,
                     door_time  = $2,
                     start_time = $3,
                     end_time   = $4,
                     description = $5,
                     updated_at = NOW()
               WHERE id = $6`,
            [venueId || null, doorTime || null, startTime || null, endTime || null, description || null, eventId]
        );

        return res.status(200).json({ message: 'Event aktualisiert' });
    } catch (err) {
        console.error('Update-event error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Events' });
    }
});

// DELETE /events/:id – entfernt ein Event, sofern keine Tickets existieren
app.delete('/events/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const { rows: ticketCheck } = await client.query(
            `SELECT 1
             FROM tickets t
                      JOIN event_categories ec ON ec.id = t.event_category_id
             WHERE ec.event_id = $1
             LIMIT 1`,
            [eventId]
        );
        if (ticketCheck.length > 0) {
            return res
                .status(400)
                .json({ message: 'Event kann nicht gelöscht werden, da Tickets existieren.' });
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM cart_items WHERE event_id = $1', [eventId]);
        await client.query('DELETE FROM checkout_items WHERE event_id = $1', [eventId]);
        await client.query(
            `DELETE FROM order_tickets ot
             USING tickets t, event_categories ec
             WHERE ot.ticket_id = t.id
               AND t.event_category_id = ec.id
               AND ec.event_id = $1`,
            [eventId]
        );
        await client.query(
            `DELETE FROM tickets t
             USING event_categories ec
             WHERE t.event_category_id = ec.id
               AND ec.event_id = $1`,
            [eventId]
        );
        await client.query(
            `DELETE FROM event_venue_areas eva
             USING event_categories ec
             WHERE eva.category_id = ec.id
               AND ec.event_id = $1`,
            [eventId]
        );
        await client.query('DELETE FROM event_supporting_acts WHERE event_id = $1', [eventId]);
        await client.query('DELETE FROM event_categories WHERE event_id = $1', [eventId]);
        await client.query('DELETE FROM events WHERE id = $1', [eventId]);
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Event gelöscht' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete-event error:', err);
        return res.status(500).json({ message: 'Serverfehler beim Löschen des Events' });
    }
});

// ── just after your session / client setup ──

// Helper to find-or-create a cart
async function getOrCreateCart(userId) {
    const { rows } = await client.query(
        'SELECT id FROM carts WHERE user_id = $1',
        [userId]
    );
    if (rows.length) return rows[0].id;

    const cartId = uuidv4();
    await client.query(
        'INSERT INTO carts (id, user_id) VALUES ($1, $2)',
        [cartId, userId]
    );
    return cartId;
}

/**
 * POST /cart-items
 * Body: { eventId, eventCategoryId, quantity, price }
 */
// POST /cart-items
app.post('/cart-items', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const { eventCategoryId, quantity, isAssistanceTicket } = req.body;
    if (!eventCategoryId || quantity == null) {
        return res.status(400).json({ message: 'Missing parameters' });
    }

    try {
        // 1) ensure cart exists
        const cartId = await getOrCreateCart(userId);

        // 2) reject duplicate
        const { rows: dup } = await client.query(
            `SELECT 1
             FROM cart_items
             WHERE cart_id = $1
               AND event_category_id = $2
               AND is_assistance_ticket = $3`,
            [cartId, eventCategoryId, !!isAssistanceTicket]
        );
        if (dup.length) {
            return res.status(409).json({ message: 'Item already in cart' });
        }

        // 3) fetch category info (including event_id and disability flag)
        const { rows: catInfo } = await client.query(
            `SELECT event_id, disability_support_for
             FROM event_categories
             WHERE id = $1`,
            [eventCategoryId]
        );
        if (catInfo.length === 0) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        const catEventId = catInfo[0].event_id;
        const isDisabledCat = catInfo[0].disability_support_for !== null;

        if (isDisabledCat) {
            const { rows: uRows } = await client.query(
                'SELECT is_currently_disabled, disability_card_expiry_date FROM users WHERE user_id = $1',
                [userId]
            );
            const u = uRows[0] || {};
            const expiry = u.disability_card_expiry_date;
            if (!u.is_currently_disabled || (expiry && new Date(expiry) < new Date())) {
                return res.status(403).json({ message: 'Not eligible for disabled tickets' });
            }
        }

        if (!isAssistanceTicket) {

            // 4) enforce quantity limits
            if (isDisabledCat) {
                // one disabled ticket per event max
                const { rows: dRows } = await client.query(
                    `SELECT COALESCE(SUM(ci.quantity),0) AS qty
                 FROM cart_items ci
                 JOIN event_categories ec ON ec.id = ci.event_category_id
                 WHERE ci.cart_id = $1
                   AND ec.event_id = $2
                   AND ec.disability_support_for IS NOT NULL`,
                    [cartId, catEventId]
                );
                if (Number(dRows[0].qty) >= 1 || quantity > 1) {
                    return res.status(400).json({ message: 'Disabled ticket limit exceeded' });
                }
            } else {
                // up to 8 regular tickets per event
                const { rows: rRows } = await client.query(
                    `SELECT COALESCE(SUM(ci.quantity),0) AS qty
                 FROM cart_items ci
                 JOIN event_categories ec ON ec.id = ci.event_category_id
                 WHERE ci.cart_id = $1
                   AND ec.event_id = $2
                   AND ec.disability_support_for IS NULL`,
                    [cartId, catEventId]
                );
                if (Number(rRows[0].qty) + Number(quantity) > 8) {
                    return res.status(400).json({ message: 'Regular ticket limit exceeded' });
                }
            }
        } // end quantity limits check

        // 5) insert the new cart_item (no price column!)
        const { rows } = await client.query(
            `INSERT INTO cart_items
               (id, cart_id, event_id, event_category_id, quantity, is_assistance_ticket)
             VALUES
               ($1, $2, $3, $4, $5, $6)
             RETURNING id, quantity`,
            [uuidv4(), cartId, catEventId, eventCategoryId, quantity, !!isAssistanceTicket]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error adding to cart:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /cart-items
// GET /cart-items
app.get('/cart-items', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        // 1) find existing cart
        const { rows: cartRows } = await client.query(
            `SELECT id
             FROM carts
             WHERE user_id = $1`,
            [userId]
        );
        if (cartRows.length === 0) {
            return res.json({ items: [] });
        }
        const cartId = cartRows[0].id;

        // 2) fetch items, pulling price from event_categories.price
        const { rows } = await client.query(
            `
                SELECT
                    ci.id,
                    ci.event_id,
                    ec.id AS event_category_id,
                    ec.disability_support_for,
                    t.title AS title,
                    ec.name AS category,
                    ci.quantity,
                    ci.is_assistance_ticket,
                    CASE WHEN ci.is_assistance_ticket THEN 0 ELSE ec.price END AS price
                FROM cart_items ci
                         JOIN events e ON e.id = ci.event_id
                         JOIN tours t ON t.id = e.tour_id
                         JOIN event_categories ec ON ec.id = ci.event_category_id
                WHERE ci.cart_id = $1
                ORDER BY ci.added_at
            `,
            [cartId]
        );

        return res.json({ items: rows });
    } catch (err) {
        console.error('Error fetching cart items:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/cart-items/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const cartItemId = req.params.id;
    const { quantity } = req.body;
    if (typeof quantity !== 'number') {
        return res.status(400).json({ message: 'Missing quantity' });
    }

    try {
        // ensure that this item actually belongs to user’s cart
        const cartId = await getOrCreateCart(userId);

        // get item details
        const { rows: itemRows } = await client.query(
            `SELECT ci.quantity, ci.is_assistance_ticket, ec.event_id, ec.disability_support_for
             FROM cart_items ci
                      JOIN event_categories ec ON ec.id = ci.event_category_id
             WHERE ci.id = $1 AND ci.cart_id = $2`,
            [cartItemId, cartId]
        );
        if (itemRows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        const oldQty = itemRows[0].quantity;
        const eventId = itemRows[0].event_id;
        const isDisabled = itemRows[0].disability_support_for !== null;
        if (itemRows[0].is_assistance_ticket) {
            return res.status(400).json({ message: 'Cannot modify assistance ticket' });
        }

        if (isDisabled) {
            if (quantity > 1) {
                return res.status(400).json({ message: 'Disabled ticket limit exceeded' });
            }
        } else {
            const { rows: rRows } = await client.query(
                `SELECT COALESCE(SUM(ci.quantity),0) AS qty
                 FROM cart_items ci
                          JOIN event_categories ec ON ec.id = ci.event_category_id
                 WHERE ci.cart_id = $1 AND ec.event_id = $2 AND ec.disability_support_for IS NULL`,
                [cartId, eventId]
            );
            const total = Number(rRows[0].qty) || 0;
            const newTotal = total - oldQty + quantity;
            if (newTotal > 8) {
                return res.status(400).json({ message: 'Regular ticket limit exceeded' });
            }
        }

        const result = await client.query(
            `UPDATE cart_items
         SET quantity = $1
       WHERE id = $2 AND cart_id = $3
       RETURNING id, quantity`,
            [quantity, cartItemId, cartId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error patching cart item:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE one cart‐item
app.delete('/cart-items/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const cartItemId = req.params.id;
    try {
        // 1) Fetch the cart_id for this item
        const { rows } = await client.query(
            'SELECT cart_id, event_category_id, is_assistance_ticket FROM cart_items WHERE id = $1',
            [cartItemId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // 2) Verify it belongs to the user
        const cartId = rows[0].cart_id;
        const eventCategoryId = rows[0].event_category_id;
        const isAssistance = rows[0].is_assistance_ticket;
        const { rows: ownerCheck } = await client.query(
            'SELECT 1 FROM carts WHERE id = $1 AND user_id = $2',
            [cartId, userId]
        );
        if (ownerCheck.length === 0) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (isAssistance) {
            return res.status(400).json({ message: 'Cannot delete assistance ticket directly' });
        }

        await client.query('BEGIN');

        // 3) Delete it
        await client.query(
            'DELETE FROM cart_items WHERE id = $1',
            [cartItemId]
        );

        // 4) remove assistance ticket if no more regular items for category
        const { rows: remaining } = await client.query(
            `SELECT 1 FROM cart_items WHERE cart_id = $1 AND event_category_id = $2 AND is_assistance_ticket = false LIMIT 1`,
            [cartId, eventCategoryId]
        );
        if (remaining.length === 0) {
            await client.query(
                'DELETE FROM cart_items WHERE cart_id = $1 AND event_category_id = $2 AND is_assistance_ticket = true',
                [cartId, eventCategoryId]
            );
        }

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting cart item:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// helper: find existing checkout for this user
async function getCheckoutIdForUser(userId) {
    const { rows } = await client.query(
        `SELECT id FROM checkouts WHERE user_id = $1`,
        [userId]
    );
    return rows[0] && rows[0].id;
}

// POST /checkout
// – creates a checkout + copies all cart_items → checkout_items
app.post('/checkout', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        // 1) Guard: no double‐checkout
        const existing = await getCheckoutIdForUser(userId);
        if (existing) {
            return res.status(409).json({ message: 'Checkout already exists' });
        }

        await client.query('BEGIN');

        // 2) Create checkout
        const checkoutId = uuidv4();
        await client.query(
            `INSERT INTO checkouts (id, user_id) VALUES ($1, $2)`,
            [checkoutId, userId]
        );

        // 3) Grab all cart_items for user (with their current price)
        const { rows: cartItems } = await client.query(
            `
      SELECT
        ci.event_category_id,
        ci.quantity,
        ci.is_assistance_ticket,
        CASE WHEN ci.is_assistance_ticket THEN 0 ELSE ec.price END AS price,
        ec.event_id
      FROM cart_items ci
      JOIN carts c              ON ci.cart_id = c.id
      JOIN event_categories ec  ON ci.event_category_id = ec.id
      WHERE c.user_id = $1
      `,
            [userId]
        );

        // 4) Insert them into checkout_items
        for (const item of cartItems) {
            await client.query(
                `INSERT INTO checkout_items
           (id, checkout_id, event_category_id, quantity, price, event_id, is_assistance_ticket)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [uuidv4(), checkoutId, item.event_category_id, item.quantity, item.price, item.event_id, item.is_assistance_ticket]
            );
        }

        // 5) (optional) clear the cart now that items are in checkout:
        await client.query(
            `DELETE FROM cart_items
         USING carts
        WHERE cart_items.cart_id = carts.id
          AND carts.user_id = $1`,
            [userId]
        );

        await client.query('COMMIT');

        req.session.checkout = {
            id: checkoutId,
            startedAt: Date.now(),
            shippingInfo: null,
        };

        return res.status(201).json({ checkoutId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating checkout:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /checkout-items
// – returns everything you need to render the checkout page
app.get('/checkout-items', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const checkoutSession = req.session.checkout;
    if (!checkoutSession || Date.now() - checkoutSession.startedAt > 15 * 60 * 1000) {
        return res.status(404).json({ message: 'No active checkout' });
    }

    try {
        // 1) find checkout for this user
        const { rows: coRows } = await client.query(
            'SELECT id, created_at FROM checkouts WHERE user_id = $1',
            [userId]
        );
        if (coRows.length === 0) {
            return res.status(404).json({ message: 'No active checkout' });
        }
        const { id: checkoutId, created_at } = coRows[0];

        // 2) fetch items with all needed fields
        const { rows: items } = await client.query(
            `
                SELECT
                    ci.id,
                    ci.event_id    AS "eventId",
                    ec.name        AS category,
                    t.title        AS "eventTitle",
                    v.name         AS "eventVenue",
                    c.name         AS "eventCity",
                    e.start_time   AS "startTime",
                    e.start_time::date AS "eventDate",
                    e.start_time::time AS "eventStartTime",
                    t.tour_image   AS image,
                    ci.quantity,
                    ci.price,
                    ci.is_assistance_ticket
                FROM checkout_items ci
                         JOIN event_categories ec ON ec.id        = ci.event_category_id
                         JOIN events            e  ON e.id         = ci.event_id
                         JOIN tours             t  ON t.id         = e.tour_id
                         JOIN venues            v  ON v.id         = e.venue_id
                         JOIN cities            c  ON c.id         = v.city_id   
                WHERE ci.checkout_id = $1
                ORDER BY ci.added_at
            `,
            [checkoutId]
        );

        // 3) return createdAt + items array
        return res.json({
            createdAt: created_at,
            items
        });
    } catch (err) {
        console.error('Error fetching checkout items:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/checkout', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        // 1) find checkout
        const { rows } = await client.query(
            'SELECT id FROM checkouts WHERE user_id = $1',
            [userId]
        );
        if (!rows.length) return res.status(404).json({ message: 'No checkout to delete' });
        const checkoutId = rows[0].id;

        // 2) delete in a transaction
        await client.query('BEGIN');
        await client.query('DELETE FROM checkout_items WHERE checkout_id = $1', [checkoutId]);
        await client.query('DELETE FROM checkouts WHERE id = $1', [checkoutId]);
        await client.query('COMMIT');
        req.session.checkout = null;

        return res.json({ message: 'Checkout cleared' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting checkout:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /checkout-items/:id
app.delete('/checkout-items/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const itemId = req.params.id;
    try {
        // ensure this belongs to the user’s checkout
        const result = await client.query(
            `DELETE FROM checkout_items ci
         USING checkouts co
        WHERE ci.id = $1
          AND ci.checkout_id = co.id
          AND co.user_id = $2`,
            [itemId, userId]
        );

        // rowCount===0 ⇒ not found or forbidden
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // check if any items remain for this user's checkout
        const { rows: remaining } = await client.query(
            `SELECT ci.id
             FROM checkout_items ci
             JOIN checkouts co ON ci.checkout_id = co.id
             WHERE co.user_id = $1
             LIMIT 1`,
            [userId]
        );
        if (remaining.length === 0) {
            await client.query('DELETE FROM checkouts WHERE user_id = $1', [userId]);
            req.session.checkout = null;
        }

        return res.json({ message: 'Item removed' });
    } catch (err) {
        console.error('Error deleting checkout item:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.post('/orders', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const sessionCheckout = req.session.checkout;
    if (!sessionCheckout || Date.now() - sessionCheckout.startedAt > 15 * 60 * 1000) {
        req.session.checkout = null;
        return res.status(400).json({ message: 'Checkout expired' });
    }
    if (!sessionCheckout.shippingInfo || !sessionCheckout.paymentMethod) {
        return res.status(400).json({ message: 'Missing checkout info' });
    }

    try {
        await client.query('BEGIN');

        // find checkout record
        const { rows: coRows } = await client.query(
            'SELECT id FROM checkouts WHERE user_id = $1',
            [userId]
        );
        if (coRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No active checkout' });
        }
        const checkoutId = coRows[0].id;

        // Pull event_id as well so we can look up capacity for this category
        const { rows: items } = await client.query(
            `SELECT id,
              event_id,
              event_category_id,
              quantity,
              price,
              is_assistance_ticket
       FROM checkout_items
       WHERE checkout_id = $1`,
            [checkoutId]
        );

        // Insert order header
        const info = sessionCheckout.shippingInfo.shippingInfo || {};
        const paymentId = sessionCheckout.paymentMethod;
        const orderId = uuidv4();
        await client.query(
            `INSERT INTO orders
             (id, user_id, created_at,
              street_address, postal_code, city, country,
              is_paid, salutation, first_name, last_name, company,
              payment_option_id)
             VALUES
                 ($1, $2, NOW(),
                  $3, $4, $5, $6,
                  false, $7, $8, $9, $10,
                  $11)`,
            [
                orderId,
                userId,
                info.streetAddress || null,
                info.postalCode    || null,
                info.city          || null,
                info.country       || null,
                info.salutation    || null,
                info.firstName     || null,
                info.lastName      || null,
                info.company       || null,
                paymentId,
            ]
        );

        // For each category in the cart, figure out seat numbers
        for (const it of items) {
            // 1) load capacity for this category (and event, if you want to enforce per-event)
            const { rows: capRows } = await client.query(
                `SELECT eva.capacity
           FROM event_venue_areas eva
          WHERE eva.category_id = $1
            AND eva.event_id    = $2`,    // remove event_id filter if not needed
                [it.event_category_id, it.event_id]
            );
            if (capRows.length === 0) {
                throw new Error(`No seating defined for category ${it.event_category_id}`);
            }
            const capacity = capRows[0].capacity;

            // 2) grab all already-taken seats for this category
            const { rows: seatRows } = await client.query(
                `SELECT seat_number
           FROM tickets
          WHERE event_category_id = $1`,
                [it.event_category_id]
            );
            // parse to integers
            const taken = new Set(seatRows.map(r => parseInt(r.seat_number, 10)));

            // 3) for each ticket to mint, pick the lowest-numbered free seat
            for (let i = 0; i < it.quantity; i++) {
                let seatNum = null;
                for (let n = 1; n <= capacity; n++) {
                    if (!taken.has(n)) {
                        seatNum = n;
                        taken.add(n);
                        break;
                    }
                }
                if (!seatNum) {
                    throw new Error(
                        `Sold out: cannot assign ${it.quantity} tickets in category ${it.event_category_id}`
                    );
                }

                const ticketId = uuidv4();
                await client.query(
                    `INSERT INTO tickets
                     (id, order_id, event_category_id,
                      seat_number, price, created_at,
                      is_assistance_ticket)
                     VALUES ($1,$2,$3,$4,$5,NOW(),$6)`,
                    [
                        ticketId,
                        orderId,
                        it.event_category_id,
                        seatNum.toString(),
                        it.price,
                        it.is_assistance_ticket,
                    ]
                );
                await client.query(
                    `INSERT INTO order_tickets (id, order_id, ticket_id)
           VALUES ($1, $2, $3)`,
                    [uuidv4(), orderId, ticketId]
                );
            }
        }

        // Clean up
        await client.query('DELETE FROM checkout_items WHERE checkout_id = $1', [checkoutId]);
        await client.query('DELETE FROM checkouts      WHERE id          = $1', [checkoutId]);
        await client.query('COMMIT');

        req.session.checkout = null;
        return res.status(201).json({ orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
});
app.get('/payment-options', async (req, res) => {
    try {
        const result = await client.query(
            'SELECT id, label, description, icon_src FROM payment_options ORDER BY label'
        );
        res.status(200).json({ paymentOptions: result.rows });
    } catch (error) {
        console.error('Error fetching payment options:', error);
        res.status(500).json({ message: 'Fehler beim Laden der Zahlungsarten' });
    }
});

// Liefert alle Bestellungen des eingeloggten Users
app.get('/orders', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        const { rows } = await client.query(
            `SELECT
                 o.id,
                 o.created_at,
                 COUNT(ot.ticket_id) AS ticket_count
             FROM orders o
                      LEFT JOIN order_tickets ot
                                ON ot.order_id = o.id
             WHERE o.user_id = $1
             GROUP BY
                 o.id,
                 o.created_at
             ORDER BY
                 o.created_at DESC`,
            [userId]
        );
        return res.json({ orders: rows });
    } catch (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert alle Events, für die der eingeloggte Nutzer Tickets besitzt
app.get('/my-events', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        const { rows } = await client.query(
            `SELECT
                e.id         AS event_id,
                e.start_time,
                v.name       AS venue_name,
                c.name       AS city_name,
                t.id         AS tour_id,
                t.title      AS tour_title,
                t.tour_image,
                (SELECT artist_id FROM tour_artists WHERE tour_id = t.id LIMIT 1) AS artist_id
             FROM tickets tk
                  JOIN orders o           ON o.id  = tk.order_id
                  JOIN event_categories ec ON ec.id = tk.event_category_id
                  JOIN events e           ON e.id  = ec.event_id
                  JOIN tours t            ON t.id  = e.tour_id
                  JOIN venues v           ON v.id  = e.venue_id
                  JOIN cities c           ON c.id  = v.city_id
             WHERE o.user_id = $1
             GROUP BY e.id, e.start_time, v.name, c.name, t.id, t.title, t.tour_image
             ORDER BY e.start_time`,
            [userId]
        );
        return res.json({ events: rows });
    } catch (err) {
        console.error('Error fetching my events:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Liefert Details zu einer bestimmten Bestellung
app.get('/orders/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    const orderId = req.params.id;

    try {
        const { rows: orderRows } = await client.query(
            `SELECT id, created_at, street_address, postal_code, city, country,
                    is_paid, salutation, first_name, last_name, company,
                    payment_option_id
               FROM orders
              WHERE id = $1 AND user_id = $2
              LIMIT 1`,
            [orderId, userId]
        );
        if (!orderRows.length) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const order = orderRows[0];

        const { rows: ticketRows } = await client.query(
            `SELECT t.id,
                    t.seat_number,
                    t.is_assistance_ticket,
                    ec.name  AS event_category,
                    tu.title AS event_title
               FROM tickets t
                    JOIN event_categories ec ON ec.id = t.event_category_id
                    JOIN events e          ON e.id  = ec.event_id
                    JOIN tours  tu         ON tu.id = e.tour_id
              WHERE t.order_id = $1
              ORDER BY t.created_at`,
            [orderId]
        );

        return res.json({ order, tickets: ticketRows });
    } catch (err) {
        console.error('Error fetching order detail:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.get(/.*/, (req, res) => {
    res.redirect(301, 'http://localhost:3000');
});

async function startServer() {
    while (true) {
        try {
            await db.query('SELECT 1');
            console.log('DB connected');
            break;
        } catch (err) {
            console.error('Failed to connect to DB, retrying in 5s...', err);
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    app.listen(4000, () => console.log('Server listening on http://localhost:4000'));

    // cleanup: remove expired checkouts and stale cart items every minute
    setInterval(async () => {
        try {
            // drop cart items referencing removed events or categories
            await db.query(`
                DELETE FROM cart_items ci
                WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = ci.event_id)
                   OR NOT EXISTS (SELECT 1 FROM event_categories ec WHERE ec.id = ci.event_category_id)
            `);

            // remove past events and all dependent data
            await db.query(`
                DELETE FROM order_tickets ot
                USING tickets t, event_categories ec, events e
                WHERE ot.ticket_id = t.id
                  AND t.event_category_id = ec.id
                  AND ec.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM tickets t
                USING event_categories ec, events e
                WHERE t.event_category_id = ec.id
                  AND ec.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM cart_items ci
                USING events e
                WHERE ci.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM checkout_items ci
                USING events e
                WHERE ci.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM event_venue_areas eva
                USING event_categories ec, events e
                WHERE eva.category_id = ec.id
                  AND ec.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM event_supporting_acts esa
                USING events e
                WHERE esa.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM event_categories ec
                USING events e
                WHERE ec.event_id = e.id
                  AND e.end_time < NOW()
            `);
            await db.query(`
                DELETE FROM events
                WHERE end_time < NOW()
            `);

            // delete checkout items older than 15 minutes
            await db.query(`
                DELETE FROM checkout_items ci
                USING checkouts co
                WHERE ci.checkout_id = co.id
                  AND co.created_at < NOW() - INTERVAL '15 minutes'
            `);

            // delete the checkout records themselves
            await db.query(`
                DELETE FROM checkouts
                WHERE created_at < NOW() - INTERVAL '15 minutes'
            `);
        } catch (err) {
            console.error('Periodic cleanup error:', err);
        }
    }, 60 * 1000);
}

startServer();