const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function saveAttendee({ firstName, lastName, birthdate, note }) {
  const res = await fetch(`${API_URL}/api/attendees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, birthdate, note }),
  });
  if (!res.ok) {
    throw new Error(`Save failed with status ${res.status}`);
  }
  return res.json();
}

export async function saveGeneratedProfile(personalId, profile) {
  const res = await fetch(`${API_URL}/api/attendees/${personalId}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    throw new Error(`Profile save failed with status ${res.status}`);
  }
  return res.json();
}

// Task 2: generate a random profile from randomuser.me.
export async function fetchRandomProfile() {
  const res = await fetch('https://randomuser.me/api/');
  if (!res.ok) {
    throw new Error(`Profile fetch failed with status ${res.status}`);
  }
  const data = await res.json();
  const user = data.results[0];
  return {
    email: user.email,
    phone: user.phone,
    country: user.location.country,
    city: user.location.city,
    pictureUrl: user.picture.large,
  };
}

// Task 3: deliberately broken endpoint, used to demonstrate that a
// failed profile-related call does NOT block the registration save,
// and that the real HTTP status is read from the response (not hardcoded).
export async function fetchInvalidProfile() {
  const res = await fetch('https://randomuser.me/api/invalid');
  if (!res.ok) {
    // res.status is read straight from the response, never hardcoded.
    const err = new Error(`Invalid endpoint call failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
