const express = require('express');
const pool = require('../db/pool');
const {
  createAttendee,
  saveGeneratedProfile,
  updateNote,
  listAttendeesWithProfiles,
} = require('../services/attendeesService');

const router = express.Router();

// POST /api/attendees — save the registration (personal_information row).
// This succeeds independently of whether a profile was ever generated
// (task 3: profile-generation failure must not block registration save).
router.post('/attendees', async (req, res) => {
  const { firstName, lastName, birthdate, note } = req.body;

  if (!firstName || !lastName || !birthdate) {
    return res.status(400).json({ error: 'firstName, lastName and birthdate are required' });
  }

  try {
    const attendee = await createAttendee(pool, { firstName, lastName, birthdate, note });
    res.status(201).json(attendee);
  } catch (err) {
    console.error('Failed to save attendee', err);
    res.status(500).json({ error: 'Failed to save attendee' });
  }
});

// POST /api/attendees/:id/profile — save a generated profile, linked
// via personal_id, once the frontend has successfully fetched one
// from randomuser.me.
router.post('/attendees/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { email, phone, country, city, pictureUrl } = req.body;

  try {
    const profile = await saveGeneratedProfile(pool, id, { email, phone, country, city, pictureUrl });
    res.status(201).json(profile);
  } catch (err) {
    console.error('Failed to save generated profile', err);
    res.status(500).json({ error: 'Failed to save generated profile' });
  }
});

// PATCH /api/attendees/:id — update only the note.
router.patch('/attendees/:id', async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const updated = await updateNote(pool, id, note);
    if (!updated) return res.status(404).json({ error: 'Attendee not found' });
    res.json(updated);
  } catch (err) {
    console.error('Failed to update note', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// GET /api/attendees — the JOIN query from task 4.
router.get('/attendees', async (req, res) => {
  try {
    const rows = await listAttendeesWithProfiles(pool);
    res.json(rows);
  } catch (err) {
    console.error('Failed to list attendees', err);
    res.status(500).json({ error: 'Failed to list attendees' });
  }
});

module.exports = router;
