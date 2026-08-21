const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const createApp = require('../app');
const { createDb } = require('../db');

// Spins up the real Express app on a random port, backed by a fresh
// in-memory SQLite database, so each test starts from a clean slate and
// never touches the real attendees.db file.
function startTestServer() {
  const db = createDb(':memory:');
  const app = createApp(db);
  const server = app.listen(0);
  const { port } = server.address();
  return { server, baseUrl: `http://localhost:${port}` };
}

function request(baseUrl, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

test('PATCH /api/attendees/:id returns 404 for an attendee that does not exist', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const res = await request(baseUrl, 'PATCH', '/api/attendees/999999', {
    birthdate: '2000-01-01',
  });

  assert.equal(res.status, 404);
  assert.match(res.body.error, /does not exist/i);
});

test('PATCH /api/attendees/:id updates the birthdate for an existing attendee', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const created = await request(baseUrl, 'POST', '/api/attendees', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    birthdate: '1990-01-01',
    city: 'Kigali',
    latitude: -1.9441,
    longitude: 30.0619,
  });
  assert.equal(created.status, 201);

  const updated = await request(
    baseUrl,
    'PATCH',
    `/api/attendees/${created.body.attendee_id}`,
    { birthdate: '1991-05-20' }
  );

  assert.equal(updated.status, 200);
  assert.equal(updated.body.birthdate, '1991-05-20');
});

test('PATCH /api/attendees/:id rejects an invalid birthdate', async (t) => {
  const { server, baseUrl } = startTestServer();
  t.after(() => server.close());

  const res = await request(baseUrl, 'PATCH', '/api/attendees/1', {
    birthdate: 'not-a-date',
  });

  assert.equal(res.status, 400);
});
