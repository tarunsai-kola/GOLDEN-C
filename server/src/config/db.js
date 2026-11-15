const mongoose = require('mongoose');
const { config } = require('./env');
const logger = require('../utils/logger');

let isConnecting = false;

async function connectDB() {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait briefly
  if (isConnecting) {
    let waitCount = 0;
    while (mongoose.connection.readyState === 2 && waitCount < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitCount++;
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
  }

  try {
    isConnecting = true;
    const uri = process.env.MONGO_URI || config.MONGO_URI;

    if (!uri) {
      logger.warn('No MONGO_URI provided in environment. Skipping database connection.');
      return null;
    }

    if (process.env.VERCEL && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
      logger.warn('Local MONGO_URI detected on Vercel cloud environment. Please set your Atlas MONGO_URI in Vercel project settings.');
      return null;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
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
