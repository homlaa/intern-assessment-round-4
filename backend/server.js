const createApp = require('./app');
const { createDb } = require('./db');

async function start() {
  const PORT = process.env.PORT || 3000;
  try {
    const db = await createDb();
    const app = createApp(db);
    app.listen(PORT, () => {
      console.log(`Registration API listening on http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
