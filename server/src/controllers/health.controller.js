const mongoose = require('mongoose');
const ApiResponse = require('../utils/apiResponse');
const { API_MESSAGES } = require('../constants');

const getDbStatus = () => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] || 'unknown';
};

const healthCheck = (req, res) => {
  const dbStatus = getDbStatus();
  const data = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    version: '1.0.0',
  };
  return ApiResponse.success(res, API_MESSAGES.SUCCESS, data);
};

module.exports = { healthCheck };
