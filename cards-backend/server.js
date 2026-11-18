const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const {
  startReminderScheduler,
  stopReminderScheduler
} = require('./services/reminderScheduler');

// --- App ------------------------------------------------------------------
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

// --- Database and server startup ------------------------------------------

const url =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/CalendarDB';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB first.
    await mongoose.connect(url);

    console.log('MongoDB connected successfully via Mongoose');

    // Start the scheduler only after MongoDB is ready.
    startReminderScheduler();

    // Start Express.
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown.
    const shutdown = async () => {
      console.log('Shutting down server...');

      stopReminderScheduler();

      server.close(async () => {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
        process.exit(0);
      });
    };

    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);

  } catch (error) {
    console.error('Backend startup failed:', error);
    process.exit(1);
  }
}

// Only start automatically when running server.js directly.
if (require.main === module) {
  startServer();
}

module.exports = app;
