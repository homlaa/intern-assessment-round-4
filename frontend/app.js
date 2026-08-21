// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const API_BASE = 'http://localhost:3001/api'; // backend from part 4

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------
const form = document.getElementById('registration-form');
const fields = {
  firstName: document.getElementById('firstName'),
  lastName: document.getElementById('lastName'),
  birthdate: document.getElementById('birthdate'),
  city: document.getElementById('city'),
};
const weatherResultEl = document.getElementById('weather-result');
const statusMessageEl = document.getElementById('status-message');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');

// Holds the last successfully geocoded location for the current city value.
// Cleared whenever the city text changes, so Save can't submit stale coords.
let lastGeocodedCity = null; // { name, latitude, longitude }

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function setFieldError(fieldName, message) {
  const errorEl = document.getElementById(`error-${fieldName}`);
  const inputEl = fields[fieldName];
  errorEl.textContent = message || '';
  inputEl.classList.toggle('invalid', Boolean(message));
}

function validateForm() {
  let isValid = true;

  if (!fields.firstName.value.trim()) {
    setFieldError('firstName', 'First name is required.');
    isValid = false;
  } else {
    setFieldError('firstName', '');
  }

  if (!fields.lastName.value.trim()) {
    setFieldError('lastName', 'Last name is required.');
    isValid = false;
  } else {
    setFieldError('lastName', '');
  }

  if (!fields.birthdate.value) {
    setFieldError('birthdate', 'Birthdate is required.');
    isValid = false;
  } else if (new Date(fields.birthdate.value) > new Date()) {
    setFieldError('birthdate', 'Birthdate cannot be in the future.');
    isValid = false;
  } else {
    setFieldError('birthdate', '');
  }

  if (!fields.city.value.trim()) {
    setFieldError('city', 'City is required.');
    isValid = false;
  } else if (!lastGeocodedCity || lastGeocodedCity.name !== fields.city.value.trim()) {
    setFieldError('city', 'Please wait for the city to be found before saving.');
    isValid = false;
  } else {
    setFieldError('city', '');
  }

  return isValid;
}

// ---------------------------------------------------------------------------
// Geocoding + weather (both async/await + try/catch, per task 2 & 3)
// ---------------------------------------------------------------------------
class CityNotFoundError extends Error {}

async function geocodeCity(cityName) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = await response.json();

  // Open-Meteo returns no "results" key at all when nothing matches.
  if (!data.results || data.results.length === 0) {
    throw new CityNotFoundError(`No location found for "${cityName}"`);
  }

  const { latitude, longitude, name } = data.results[0];
  return { latitude, longitude, name };
}

async function fetchCurrentWeather(latitude, longitude) {
  const url = `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.current_weather) {
    throw new Error('Weather data unavailable for this location.');
  }

  return data.current_weather; // { temperature, windspeed, ... }
}

async function handleCityLookup() {
  const cityName = fields.city.value.trim();
  weatherResultEl.hidden = true;
  weatherResultEl.classList.remove('warning');
  lastGeocodedCity = null;

  if (!cityName) {
    return;
  }

  try {
    // Step 1: geocode
    const location = await geocodeCity(cityName);
    lastGeocodedCity = location;
    setFieldError('city', '');

    // Step 2: weather, using the coordinates from step 1
    const weather = await fetchCurrentWeather(location.latitude, location.longitude);

    weatherResultEl.hidden = false;
    weatherResultEl.textContent =
      `${location.name}: ${weather.temperature}°C, wind ${weather.windspeed} km/h`;
  } catch (err) {
    if (err instanceof CityNotFoundError) {
      // Troubleshooting case (task 3): geocoding found nothing for this city.
      setFieldError('city', `City not found: "${cityName}". Try a different spelling.`);
      weatherResultEl.hidden = false;
      weatherResultEl.classList.add('warning');
      weatherResultEl.textContent = `Status: city not found — no weather lookup was performed.`;
    } else {
      console.error(err);
      setFieldError('city', 'Could not look up this city right now. Please try again.');
    }
  }
}

// Trigger the geocoding + weather lookup once the user finishes typing a city.
fields.city.addEventListener('blur', handleCityLookup);
fields.city.addEventListener('input', () => {
  // Any manual edit invalidates the previous lookup until it's re-verified.
  lastGeocodedCity = null;
});

// ---------------------------------------------------------------------------
// Save / Clear
// ---------------------------------------------------------------------------
function setStatus(message, type) {
  statusMessageEl.textContent = message;
  statusMessageEl.className = `status-message ${type || ''}`.trim();
}

async function handleSave(event) {
  event.preventDefault();
  setStatus('', '');

  if (!validateForm()) {
    setStatus('Please fix the highlighted fields.', 'error');
    return;
  }

  const payload = {
    firstName: fields.firstName.value.trim(),
    lastName: fields.lastName.value.trim(),
    birthdate: fields.birthdate.value,
    city: lastGeocodedCity.name,
    latitude: lastGeocodedCity.latitude,
    longitude: lastGeocodedCity.longitude,
  };

  saveBtn.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save registration.');
    }

    setStatus('Registration saved successfully!', 'success');
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Something went wrong while saving.', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

function handleClear() {
  form.reset();
  Object.keys(fields).forEach((name) => setFieldError(name, ''));
  weatherResultEl.hidden = true;
  weatherResultEl.classList.remove('warning');
  lastGeocodedCity = null;
  setStatus('', '');
}

form.addEventListener('submit', handleSave);
clearBtn.addEventListener('click', handleClear);
