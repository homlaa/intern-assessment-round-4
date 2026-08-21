const express = require('express');
const cors = require('cors');
const attendeesRouter = require('./routes/attendees');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', attendeesRouter);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
