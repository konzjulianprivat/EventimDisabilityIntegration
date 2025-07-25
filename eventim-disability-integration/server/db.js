const { Pool } = require('pg');
const CircuitBreaker = require('opossum');
const credentials = require('./credentials.json');

let pool = new Pool(credentials);
let breaker;

pool.on('error', async (err) => {
    console.error('Unexpected database error, reconnecting...', err.message);
    await reconnect();
});

function createBreaker() {
    const options = {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 5000
    };
    const breaker = new CircuitBreaker(executeQuery, options);
    breaker.on('open', () => console.error('Database circuit breaker opened'));
    breaker.on('halfOpen', () => console.warn('Database circuit breaker half-open'));
    breaker.on('close', () => console.log('Database circuit breaker closed'));
    return breaker;
}

function isConnectionError(err) {
    return [
        'ECONNREFUSED',
        'ECONNRESET',
        'ECONNABORTED',
        'EPIPE',
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
    breaker = createBreaker();
}

async function executeQuery(text, params) {
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

breaker = createBreaker();

async function query(text, params) {
    return breaker.fire(text, params);
}

async function healthCheck() {
    try {
        await query('SELECT 1');
    } catch (err) {
        console.error('Database health check failed, attempting reconnect...', err.message);
        await reconnect();
    }
}

setInterval(healthCheck, 10000);

module.exports = { query };
