const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/user.model');

/**
 * Authenticate incoming request using Bearer JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is missing'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired'));
      }
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('User belonging to this token no longer exists'));
    }

    // Check if user status is suspended
    if (user.status === 'suspended') {
      return next(ApiError.forbidden('Your account has been suspended. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'user'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
