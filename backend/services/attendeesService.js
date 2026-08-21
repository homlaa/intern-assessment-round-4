// Business logic kept separate from Express routes so it can be
// unit tested with a mocked `db` (see tests/attendees.test.js).

async function createAttendee(db, { firstName, lastName, birthdate, note }) {
  const result = await db.query(
    `INSERT INTO personal_information (first_name, last_name, birthdate, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, birthdate, note`,
    [firstName, lastName, birthdate, note || null]
  );
  return result.rows[0];
}

async function saveGeneratedProfile(db, personalId, { email, phone, country, city, pictureUrl }) {
  const result = await db.query(
    `INSERT INTO generated_profile (personal_id, email, phone, country, city, picture_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, personal_id, email, phone, country, city, picture_url`,
    [personalId, email, phone, country, city, pictureUrl]
  );
  return result.rows[0];
}

async function updateNote(db, id, note) {
  const result = await db.query(
    `UPDATE personal_information SET note = $1 WHERE id = $2
     RETURNING id, first_name, last_name, birthdate, note`,
    [note, id]
  );
  return result.rows[0] || null;
}

async function listAttendeesWithProfiles(db) {
  const result = await db.query(
    `SELECT
       pi.id, pi.first_name, pi.last_name, pi.birthdate, pi.note,
       gp.email, gp.phone, gp.country, gp.city
     FROM personal_information pi
     LEFT JOIN generated_profile gp ON gp.personal_id = pi.id
     ORDER BY pi.id`
  );
  return result.rows;
}

module.exports = {
  createAttendee,
  saveGeneratedProfile,
  updateNote,
  listAttendeesWithProfiles,
};
