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
  async login({ email, password, reactivate = false }) {
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

    if (user.status === 'deactivated' || user.isDeactivated) {
      if (reactivate) {
        user.status = 'active';
        user.isDeactivated = false;
        user.deactivatedAt = null;
      } else {
        return {
          requiresReactivation: true,
          isDeactivated: true,
          message: 'Your account is currently deactivated.',
          user: {
            _id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
          },
        };
      }
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
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (profileData.fullName !== undefined) {
      user.fullName = profileData.fullName.trim();
    }
    if (profileData.headline !== undefined) {
      user.headline = profileData.headline.trim().slice(0, 90);
    }
    if (profileData.intro !== undefined) {
      user.intro = profileData.intro.trim().slice(0, 600);
      user.bio = user.intro; // Sync for backwards-compatibility
    } else if (profileData.bio !== undefined) {
      user.bio = profileData.bio.trim();
      user.intro = user.bio.slice(0, 600);
    }
    if (profileData.workCovers !== undefined && Array.isArray(profileData.workCovers)) {
      user.workCovers = profileData.workCovers;
    }
    if (profileData.fields !== undefined && Array.isArray(profileData.fields)) {
      user.fields = profileData.fields;
    }
    if (profileData.timeCommitment !== undefined) {
      user.timeCommitment = profileData.timeCommitment;
    }
    if (profileData.lookingFor !== undefined) {
      user.lookingFor = profileData.lookingFor;
    }
    if (profileData.state !== undefined) {
      user.state = profileData.state.trim();
    }
    if (profileData.district !== undefined) {
      user.district = profileData.district.trim();
    }
    // Update consolidated location if state / district are set
    if (user.state && user.state !== 'Not saying') {
      user.location = user.district ? `${user.district}, ${user.state}` : user.state;
    } else if (profileData.location !== undefined) {
      user.location = profileData.location.trim();
    }
    if (profileData.website !== undefined) {
      user.website = profileData.website.trim();
    }
    if (profileData.linkedin !== undefined) {
      user.linkedin = profileData.linkedin.trim();
    }
    if (profileData.github !== undefined) {
      user.github = profileData.github.trim();
    }
    if (profileData.avatar !== undefined) {
      user.avatar = profileData.avatar;
    }

    await user.save();
    return user.toJSON();
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.isDeactivated = true;
    user.status = 'deactivated';
    user.deactivatedAt = new Date();
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    return {
      success: true,
      message: 'Account deactivated successfully. You have been signed out everywhere.',
    };
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount({ email, password }) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required to reactivate account');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.isDeactivated = false;
    user.status = 'active';
    user.deactivatedAt = null;

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      message: 'Account reactivated successfully. Welcome back!',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Update user status (admin or test helper)
   */
  async updateUserStatus(userId, status) {
    const validStatuses = ['pending', 'active', 'suspended', 'deactivated'];
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
