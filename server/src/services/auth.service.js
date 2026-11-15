const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} = require('../utils/token');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('./email.service');
const { config } = require('../config/env');

class AuthService {
  /**
   * Register a new user
   */
  async register({ fullName, email, password, location, accountType }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const verificationRawToken = generateRandomToken(32);
    const verificationHashedToken = hashToken(verificationRawToken);

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      location: location || '',
      accountType: accountType || 'individual',
      status: 'pending',
      isEmailVerified: false,
      emailVerificationToken: verificationHashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.fullName, verificationRawToken);

    return {
      user: user.toJSON(),
      verificationToken: config.isDev ? verificationRawToken : undefined,
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token) {
    if (!token) {
      throw ApiError.badRequest('Verification token is required');
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      $or: [
        { emailVerificationToken: hashedToken },
        { emailVerificationToken: token },
      ],
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return {
      message: 'Account verified successfully. You may now log in.',
      user: user.toJSON(),
    };
  }

  /**
   * Log in user
   */
  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +refreshToken'
    );

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(token) {
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (user.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (user.refreshToken !== token) {
      throw ApiError.unauthorized('Refresh token is invalid or has been revoked');
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      user: user.toJSON(),
    };
  }

  /**
   * Logout user and invalidate refresh token
   */
  async logout(userId) {
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Forgot password: create reset token and send email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not leak whether the email exists
      return {
        message: 'If an account exists with that email, a password reset link has been sent.',
      };
    }

    const resetRawToken = generateRandomToken(32);
    const resetHashedToken = hashToken(resetRawToken);

    user.resetPasswordToken = resetHashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, user.fullName, resetRawToken);

    return {
      message: 'If an account exists with that email, a password reset link has been sent.',
      resetToken: config.isDev ? resetRawToken : undefined,
    };
  }

  /**
   * Reset password with valid token
   */
  async resetPassword({ token, password }) {
    if (!token) {
      throw ApiError.badRequest('Password reset token is required');
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      $or: [
        { resetPasswordToken: hashedToken },
        { resetPasswordToken: token },
      ],
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // Force re-login on all devices

    await user.save();

    return {
      message: 'Password reset successful. You may now log in with your new password.',
    };
  }

  /**
   * Update user status (admin or test helper)
   */
  async updateUserStatus(userId, status) {
    const validStatuses = ['pending', 'active', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();
