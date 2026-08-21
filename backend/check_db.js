const { Client } = require('pg');
(async () => {
  try {
    const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'love', database: 'postgres' });
    await client.connect();
    const dbres = await client.query('SELECT datname FROM pg_database WHERE datname = $1', ['attendees_db']);
    console.log('db_exists:', dbres.rowCount > 0);
    if (dbres.rowCount > 0) {
      const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'love', database: 'attendees_db' });
      await c.connect();
      const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      console.log('tables:', res.rows);
      const sample = await c.query("SELECT count(*) FROM personal_information").catch(() => null);
      console.log('personal_information count:', sample ? sample.rows[0].count : 'no table');
      await c.end();
    }
    await client.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
