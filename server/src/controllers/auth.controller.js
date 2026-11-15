const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { config } = require('../config/env');

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: config.isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return ApiResponse.created(
      res,
      'Registration successful. Please check your email to verify your account.',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify account / email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.params.token;
    if (!token) {
      return next(ApiError.badRequest('Verification token is required'));
    }
    const result = await authService.verifyEmail(token);
    return ApiResponse.success(res, result.message, result.user);
  } catch (error) {
    next(error);
  }
};

/**
 * Log in user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());

    return ApiResponse.success(res, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      return next(ApiError.unauthorized('Refresh token is required'));
    }

    const result = await authService.refreshAccessToken(token);
    return ApiResponse.success(res, 'Token refreshed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    await authService.logout(userId);

    res.clearCookie(COOKIE_NAME, {
      ...getCookieOptions(),
      maxAge: 0,
    });

    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return ApiResponse.success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.params.token;
    const { password } = req.body;

    if (!token) {
      return next(ApiError.badRequest('Password reset token is required'));
    }

    const result = await authService.resetPassword({ token, password });
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user.toJSON ? req.user.toJSON() : req.user;
    return ApiResponse.success(res, 'User profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (admin / test route)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedUser = await authService.updateUserStatus(id, status);
    return ApiResponse.success(res, `User status updated to ${status}`, updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateStatus,
};
