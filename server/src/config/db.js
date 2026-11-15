const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnecting = false;

async function connectDB() {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (isConnecting) {
    let waitCount = 0;
    while (mongoose.connection.readyState === 2 && waitCount < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitCount++;
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
  }

  try {
    isConnecting = true;
    const uri = process.env.MONGO_URI;

    if (!uri) {
      logger.warn('No MONGO_URI provided. Skipping DB connection.');
      return null;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.success(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Do not crash in serverless mode; let endpoint report error gracefully
    return null;
  } finally {
    isConnecting = false;
  }
}

module.exports = { connectDB };
