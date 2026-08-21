const { Pool, Client } = require('pg');
require('dotenv').config();

// Default Postgres connection settings (can be overridden via env vars)
const PG_HOST = process.env.PGHOST || 'localhost';
const PG_PORT = process.env.PGPORT || 5432;
const PG_USER = process.env.PGUSER || 'postgres';
const PG_PASSWORD = process.env.PGPASSWORD || 'love';
const PG_DATABASE = process.env.PGDATABASE || 'attendees_db';

async function ensureDatabaseExists() {
  // Connect to default 'postgres' database to check/create the target database
  const client = new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: 'postgres'
  });

  await client.connect();
  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [PG_DATABASE]);
  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE ${PG_DATABASE}`);
  }
  await client.end();
}

async function migrate(pool) {
  // Run migrations on the connected pool
  await pool.query(`
    CREATE TABLE IF NOT EXISTS city_information (
      id SERIAL PRIMARY KEY,
      city_name TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS personal_information (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birthdate DATE NOT NULL,
      city_id INTEGER NOT NULL REFERENCES city_information(id),
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `);
}

// createDb(): ensures the target Postgres DB exists, returns a Pool connected to it
async function createDb() {
  await ensureDatabaseExists();

  const pool = new Pool({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE
  });

  // Run migrations
  await migrate(pool);

  return pool;
}

module.exports = { createDb };
