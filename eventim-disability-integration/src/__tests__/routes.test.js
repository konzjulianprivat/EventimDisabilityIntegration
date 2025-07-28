const fs = require('fs');
const path = require('path');

/** @jest-environment node */

describe('backend routes', () => {
  const serverPath = path.join(__dirname, '../../server/server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"\s]+)/g;
  const found = new Set();
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    found.add(`${match[1].toUpperCase()} ${match[2]}`);
  }

  const expectedRoutes = [
    'DELETE /artists/:id',
    'DELETE /cart-items/:id',
    'DELETE /checkout',
    'DELETE /checkout-items/:id',
    'DELETE /countries/:id',
    'DELETE /events/:id',
    'DELETE /genres/:id',
    'DELETE /tours/:id',
    'DELETE /users/:id',
    'DELETE /venues/:id',
    'GET /accepted-disability-requests',
    'GET /areas',
    'GET /artist-details/:id',
    'GET /artists',
    'GET /artists-with-images',
    'GET /cart-items',
    'GET /checkout-items',
    'GET /checkout-payment',
    'GET /checkout-shipping',
    'GET /cities',
    'GET /cities-with-venues',
    'GET /countries',
    'GET /countries-with-cities',
    'GET /disability-marks',
    'GET /email-exists',
    'GET /event-accessibility',
    'GET /event-capacities/:id',
    'GET /event-details/:id',
    'GET /event-disabled-ticket-count/:eventId',
    'GET /events-with-accessibility',
    'GET /genres',
    'GET /genres-with-subgenres',
    'GET /image/:id',
    'GET /my-events',
    'GET /orders',
    'GET /orders/:id',
    'GET /payment-options',
    'GET /pending-disability-requests',
    'GET /search-tours',
    'GET /session-status',
    'GET /shipping-options',
    'GET /subgenres',
    'GET /tour-artists',
    'GET /tour-details/:id',
    'GET /tour-genres',
    'GET /tours',
    'GET /tours-detailed',
    'GET /tours-with-images',
    'GET /user-address',
    'GET /user-roles',
    'GET /users',
    'GET /users/:id',
    'GET /users/:id/disability',
    'GET /users/:id/orders',
    'GET /venue-areas',
    'GET /venues',
    'GET /venues-detailed',
    'PATCH /cart-items/:id',
    'PATCH /users/:id',
    'PATCH /users/:id/compensation-request',
    'PATCH /users/:id/disability',
    'PATCH /users/:id/password',
    'POST /cart-items',
    'POST /checkout',
    'POST /checkout-payment',
    'POST /checkout-shipping',
    'POST /create-area',
    'POST /create-artist',
    'POST /create-city',
    'POST /create-country',
    'POST /create-event',
    'POST /create-genre',
    'POST /create-tour',
    'POST /create-venue',
    'POST /disability-requests/:id/accept',
    'POST /disability-requests/:id/decline',
    'POST /login-user',
    'POST /logout',
    'POST /orders',
    'POST /register-user',
    'POST /upload-image',
    'PUT /artists/:id',
    'PUT /countries/:id',
    'PUT /events/:id',
    'PUT /genres/:id',
    'PUT /tours/:id',
    'PUT /users/:id/role',
    'PUT /venues/:id'
  ];

  test('all routes are accounted for', () => {
    expect(found.size).toBe(expectedRoutes.length);
  });

  test.each(expectedRoutes)('route %s exists', (route) => {
    expect(found.has(route)).toBe(true);
  });
});
