const { Pool } = require('pg');

// Reads standard PG* env vars, or a single DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
