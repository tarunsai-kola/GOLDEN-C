const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function connectDB(retries = MAX_RETRIES) {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.success(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.success('MongoDB reconnected.');
    });

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      logger.info(`Retrying connection in ${RETRY_DELAY / 1000}s... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retries - 1);
    } else {
      logger.error('Max retries reached. Server will continue without DB connection.');
      // Do not exit — let server run so health endpoint still responds
    }
  }
}

module.exports = { connectDB };
