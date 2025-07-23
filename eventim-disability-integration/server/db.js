const { Pool } = require('pg');
const CircuitBreaker = require('opossum');
const credentials = require('./credentials.json');

let pool = new Pool(credentials);
let reconnectAttempts = 0;

// Exponential backoff reconnect logic
async function reconnect() {
  reconnectAttempts++;
  const delay = Math.min(30000, 1000 * 2 ** reconnectAttempts);
  console.warn(`Reconnecting in ${delay}ms…`);
  await new Promise(res => setTimeout(res, delay));
  try {
    await pool.end();
  } catch (e) {
    // ignore errors on shutdown
  }
  pool = new Pool(credentials);
}

// Handle unexpected idle clients / fatal errors
pool.on('error', err => {
  console.error('Unexpected database error – will reconnect', err.message);
  reconnect();
});

// Raw DB query function
async function rawQuery(text, params) {
  return pool.query(text, params);
}

// Wrap queries in a circuit breaker to prevent cascading failures
const breaker = new CircuitBreaker(rawQuery, {
  timeout: 5000,               // if query takes >5s, fail
  errorThresholdPercentage: 50, // if >50% of requests fail, open circuit
  resetTimeout: 30000          // after 30s, try again
});

breaker.on('open',   () => console.error('DB CIRCUIT OPEN – reconnect forced'));
breaker.on('halfOpen',() => console.log('DB CIRCUIT HALF-OPEN'));
breaker.on('close',  () => console.log('DB CIRCUIT CLOSED'));

// Exported query uses circuit breaker
async function query(text, params) {
  return breaker.fire(text, params);
}

// Periodic health check
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