const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const { validateEnv } = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

validateEnv();

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Start HTTP server first so health endpoint is reachable even if DB is unavailable
  const server = app.listen(PORT, () => {
    logger.success(`🚀 Golden Circle API running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });

  // Initialize Socket.IO on HTTP server
  initSocket(server);

  // Attempt DB connection in background — failure is logged but does NOT crash the server
  connectDB().catch((err) => {
    logger.error(`DB connection ultimately failed: ${err.message}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.warn(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    shutdown('unhandledRejection');
  });
}

startServer();
