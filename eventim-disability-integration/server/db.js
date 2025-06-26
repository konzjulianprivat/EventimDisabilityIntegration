const { Pool } = require('pg');
const credentials = require('./credentials.json');

let pool = new Pool(credentials);

function isConnectionError(err) {
    return [
        'ECONNREFUSED',
        'ECONNRESET',
        '57P01', // admin shutdown
        '57P02', // crash shutdown
        '57P03'
    ].includes(err.code);
}

async function reconnect() {
    try {
        await pool.end();
    } catch (_) {
        // ignore errors on shutdown
    }
    pool = new Pool(credentials);
}

async function query(text, params) {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (attempt === 0 && isConnectionError(err)) {
                console.error('Database query failed, reconnecting...', err.message);
                await reconnect();
                continue;
            }
            throw err;
        }
    }
}

async function healthCheck() {
    try {
        await pool.query('SELECT 1');
    } catch (err) {
        console.error('Database health check failed, attempting reconnect...', err.message);
        await reconnect();
    }
}

setInterval(healthCheck, 10000);

module.exports = { query };
