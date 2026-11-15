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

// Trust Vercel / reverse proxy headers (critical for rate limiting and real client IP resolution)
app.set('trust proxy', 1);

// Normalize rewritten URLs on Vercel serverless function invocations
app.use((req, res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    if (req.url.startsWith('/api/index') || req.url === '/index.js' || req.url === '/api/index.js') {
      req.url = req.originalUrl;
    }
  }
  next();
});

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
const allowedOrigins = (config.CLIENT_URL || '*')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        config.isDev
      ) {
        return callback(null, true);
      }
      // Never throw an error on CORS mismatches
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
app.get(['/', '/api', '/api/index.js', '/api/index', '/index.js'], (req, res) => {
  res.json({
    name: 'The Golden Circle API',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
  });
});

// API routes - mounted at both /api and root level for flexible reverse proxies
app.use('/api', mainRouter);
app.use('/', mainRouter);

// 404 handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

module.exports = app;
