-- Task 4: two tables, linked by personal_id

CREATE TABLE IF NOT EXISTS personal_information (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_profile (
  id SERIAL PRIMARY KEY,
  personal_id INTEGER NOT NULL REFERENCES personal_information(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  picture_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- JOIN query: each registrant alongside their generated profile's
-- email, phone number, country, and city.
-- (Also implemented in routes/attendees.js as GET /api/attendees)
SELECT
  pi.id,
  pi.first_name,
  pi.last_name,
  pi.birthdate,
  pi.note,
  gp.email,
  gp.phone,
  gp.country,
  gp.city
FROM personal_information pi
LEFT JOIN generated_profile gp ON gp.personal_id = pi.id
ORDER BY pi.id;
