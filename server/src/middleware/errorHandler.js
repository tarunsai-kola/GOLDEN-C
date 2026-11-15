const { config } = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);

  // Bad JSON syntax in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid JSON payload in request body',
    });
  }

  // Known ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      ...(config.isDev && { stack: err.stack }),
    });
  }

  // ZodError
  if (err.name === 'ZodError') {
    const issues = err.issues || [];
    const errors = issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: issues[0]?.message || 'Validation error',
      errors,
    });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = err.errors ? Object.values(err.errors).map((e) => e.message) : [err.message];
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, statusCode: 401, message: 'Token expired' });
  }

  // Fallback 500
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: config.isDev ? err.message : 'Internal server error',
    ...(config.isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
