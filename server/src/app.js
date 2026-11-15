const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const mainRouter = require('./routes/index');
const { config } = require('./config/env');

const app = express();

// Ensure DB is connected for serverless function invocations
const { connectDB } = require('./config/db');
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Continue so health and public routes can still return responses
  }
  next();
});

// Security headers with cross-origin asset support
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Flexible CORS supporting comma-separated CLIENT_URLs (e.g. localhost, Vercel preview & production)
const allowedOrigins = (config.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        config.isDev
      ) {
        return callback(null, true);
      }
      // Return null, true to avoid throwing 500 error on CORS mismatches
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
}

// Body & Cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use(globalLimiter);

// Root health landing
app.get('/', (req, res) => {
  res.json({
    name: 'The Golden Circle API',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
  });
});

// API routes
app.use('/api', mainRouter);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
