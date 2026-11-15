const ApiError = require('../utils/apiError');
const AdminAuditLog = require('../models/adminAuditLog.model');
const Message = require('../models/message.model');
const logger = require('../utils/logger');

/**
 * Require user to have platform admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Platform administrator privileges required'));
  }
  next();
};

/**
 * Require specific admin sub-role (super_admin always has access)
 */
const requireAdminRole = (...roles) => (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Platform administrator privileges required'));
  }

  const userRole = req.user.adminRole || 'super_admin';
  if (userRole === 'super_admin' || roles.includes(userRole)) {
    return next();
  }

  return next(
    ApiError.forbidden(`Action requires one of the following admin roles: ${roles.join(', ')}`)
  );
};

/**
 * Helper to record administrative actions to audit trail
 */
const logAdminAction = async ({
  adminId,
  adminRole = 'super_admin',
  action,
  targetType,
  targetId = '',
  reason = '',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || '' : '';
    await AdminAuditLog.create({
      adminId,
      adminRole,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      reason,
      details,
      ipAddress,
    });
  } catch (err) {
    logger.error(`Failed to record admin audit log: ${err.message}`);
  }
};

/**
 * Privacy Gate: Prevent staff from viewing unflagged private direct messages
 */
const enforceMessagePrivacyGate = async (messageId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }

  if (!message.isReported) {
    throw ApiError.forbidden(
      'Privacy Violation: Unflagged private communications cannot be inspected by platform staff.'
    );
  }

  return message;
};

module.exports = {
  requireAdmin,
  requireAdminRole,
  logAdminAction,
  enforceMessagePrivacyGate,
};
