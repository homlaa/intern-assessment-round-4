const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const attendeesRouter = require('./routes/attendees');

// createApp(db) builds an Express app wired to the given database instance.
// `db` should be a `pg` Pool connected to the target Postgres database.
function createApp(db) {
  if (!db) throw new Error('createApp requires a db Pool instance');

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/attendees', attendeesRouter(db));

  // Swagger setup
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Registration API',
      version: '1.0.0',
      description: 'API for attendee registration (cities + personal info)'
    },
    servers: [{ url: 'http://localhost:3000' }],
    paths: {
      '/api/attendees': {
        get: {
          summary: 'List attendees',
          responses: { '200': { description: 'List of attendees' } }
        },
        post: {
          summary: 'Create attendee',
          responses: { '201': { description: 'Created attendee' }, '400': { description: 'Validation error' } }
        }
      },
      '/api/attendees/{id}': {
        get: { summary: 'Get attendee by id', responses: { '200': { description: 'Attendee' }, '404': { description: 'Not found' } } },
        patch: { summary: 'Update attendee birthdate', responses: { '200': { description: 'Updated' }, '400': { description: 'Validation' } } }
      }
    }
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Fallback error handler for anything unexpected (e.g. malformed JSON body)
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(400).json({ error: 'Bad request' });
  });

  return app;
}

module.exports = createApp;
