const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

// Public auth routes with rate limiting & validation
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// Email verification (supports POST body or GET query/param)
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-account', authController.verifyEmail);
router.get('/verify-account', authController.verifyEmail);

// Password reset
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Token management & session
router.post('/refresh', authController.refreshToken);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Account reactivation (public)
router.post('/reactivate', authLimiter, authController.reactivateAccount);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.put('/me', authenticate, authController.updateProfile);
router.patch('/me', authenticate, authController.updateProfile);
router.post('/deactivate', authenticate, authController.deactivateAccount);

// Admin / Test route for updating user status (activate / suspend)
router.patch('/users/:id/status', authController.updateStatus);
router.patch('/status/:id', authController.updateStatus);

module.exports = router;
