const OrganizationMembership = require('../models/organizationMembership.model');
const ApiError = require('../utils/apiError');
const { MEMBERSHIP_STATUS } = require('../constants/roles');

/**
 * Middleware to verify that the authenticated user is an active member of the target organization.
 * Checks req.params.id, req.params.orgId, req.body.organizationId, or req.headers['x-org-id'].
 */
const requireOrgMember = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId || req.body.organizationId || req.headers['x-org-id'];

    if (!orgId) {
      return next(ApiError.badRequest('Organization ID is required'));
    }

    if (!req.user || !req.user._id) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const membership = await OrganizationMembership.findOne({
      organizationId: orgId,
      userId: req.user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organizationId');

    if (!membership) {
      return next(ApiError.forbidden('You are not an active member of this organization'));
    }

    req.membership = membership;
    req.orgRole = membership.role;
    req.targetOrganization = membership.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to enforce specific organization roles.
 * Must be preceded by requireOrgMember or authenticate.
 * @param {string[]|string} roles - e.g. ['Owner', 'Administrator']
 */
const requireOrgRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.membership || !req.orgRole) {
      return next(ApiError.forbidden('Organization membership context missing'));
    }

    if (!allowedRoles.includes(req.orgRole)) {
      return next(
        ApiError.forbidden(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${req.orgRole}`
        )
      );
    }

    next();
  };
};

module.exports = {
  requireOrgMember,
  requireOrgRole,
};
