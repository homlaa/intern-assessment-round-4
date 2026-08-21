-- ============================================================================
-- Schema (task 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS city_information (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  city_name   TEXT NOT NULL,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS personal_information (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  birthdate   TEXT NOT NULL,
  city_id     INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (city_id) REFERENCES city_information (id)
);

-- ============================================================================
-- JOIN query: attendee name alongside their city's name, latitude, longitude
-- ============================================================================

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
ORDER BY pi.id;
