const express = require('express');

// ---------------------------------------------------------------------------
// Helpers (pure functions, no db dependency — easy to unit test directly)
// ---------------------------------------------------------------------------
function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function validateRegistrationBody(body) {
  const errors = [];
  const { firstName, lastName, birthdate, city, latitude, longitude } = body;

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    errors.push('firstName is required');
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    errors.push('lastName is required');
  }
  if (!isValidDateString(birthdate)) {
    errors.push('birthdate is required and must be an ISO date (YYYY-MM-DD)');
  }
  if (!city || typeof city !== 'string' || !city.trim()) {
    errors.push('city is required');
  }
  if (typeof latitude !== 'number' || Number.isNaN(latitude)) {
    errors.push('latitude is required and must be a number (from the geocoding step)');
  }
  if (typeof longitude !== 'number' || Number.isNaN(longitude)) {
    errors.push('longitude is required and must be a number (from the geocoding step)');
  }

  return errors;
}

// The JOIN query required by task 4: attendee name + their city's name/lat/lon.
const JOIN_QUERY = `
  SELECT
    pi.id            AS attendee_id,
    pi.first_name,
    pi.last_name,
    pi.birthdate,
    ci.id            AS city_id,
    ci.city_name,
    ci.latitude,
    ci.longitude
  FROM personal_information pi
  JOIN city_information ci ON pi.city_id = ci.id
`;

// ---------------------------------------------------------------------------
// attendeesRouter(db) — factory where `db` is a `pg` Pool instance.
// ---------------------------------------------------------------------------
function attendeesRouter(db) {
  const router = express.Router();

  async function getAttendeeJoinedById(id) {
    const res = await db.query(JOIN_QUERY + ' WHERE pi.id = $1', [id]);
    return res.rows[0];
  }

  // POST /api/attendees — saves personal info + city info, linked via city_id.
  router.post('/', async (req, res) => {
    const errors = validateRegistrationBody(req.body || {});
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const { firstName, lastName, birthdate, city, latitude, longitude } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const cityResult = await client.query(
        `INSERT INTO city_information (city_name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id`,
        [city.trim(), latitude, longitude]
      );
      const cityId = cityResult.rows[0].id;

      const personResult = await client.query(
        `INSERT INTO personal_information (first_name, last_name, birthdate, city_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [firstName.trim(), lastName.trim(), birthdate, cityId]
      );

      await client.query('COMMIT');

      const created = await getAttendeeJoinedById(personResult.rows[0].id);
      return res.status(201).json(created);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Failed to save attendee:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });

  // GET /api/attendees — every attendee joined with their city info.
  router.get('/', async (req, res) => {
    const rows = (await db.query(JOIN_QUERY + ' ORDER BY pi.id')).rows;
    return res.json(rows);
  });

  // GET /api/attendees/:id — single attendee, joined.
  router.get('/:id', async (req, res) => {
    const attendee = await getAttendeeJoinedById(req.params.id);
    if (!attendee) {
      return res.status(404).json({ error: 'Attendee not found' });
    }
    return res.json(attendee);
  });

  // PATCH /api/attendees/:id — updates only the birthdate for an existing attendee.
  router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { birthdate } = req.body || {};

    if (!isValidDateString(birthdate)) {
      return res.status(400).json({ error: 'birthdate must be an ISO date (YYYY-MM-DD)' });
    }

    const existing = (await db.query('SELECT id FROM personal_information WHERE id = $1', [id])).rows[0];
    if (!existing) {
      return res.status(404).json({ error: `Attendee with id ${id} does not exist` });
    }

    await db.query('UPDATE personal_information SET birthdate = $1 WHERE id = $2', [birthdate, id]);

    const updated = await getAttendeeJoinedById(id);
    return res.status(200).json(updated);
  });

  return router;
}

module.exports = attendeesRouter;
module.exports.JOIN_QUERY = JOIN_QUERY;
module.exports.validateRegistrationBody = validateRegistrationBody;
