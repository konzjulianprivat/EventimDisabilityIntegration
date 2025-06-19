const fs = require('fs');
const path = require('path');

test('server queries contain event_id on checkout_items', () => {
  const serverPath = path.join(__dirname, '../../server/server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  expect(content).toMatch(/checkout_items[^\n]*event_id/);
});

test('server handles assistance tickets', () => {
  const serverPath = path.join(__dirname, '../../server/server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  expect(content).toMatch(/is_assistance_ticket/);
});
