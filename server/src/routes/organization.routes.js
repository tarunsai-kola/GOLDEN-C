const express = require('express');
const organizationController = require('../controllers/organization.controller');
const { authenticate } = require('../middleware/auth');
const { requireOrgMember, requireOrgRole } = require('../middleware/orgAuth');
const { ORG_ROLES } = require('../constants/roles');
const upload = require('../middleware/upload');
const {
  validate,
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} = require('../validators/organization.validator');

const router = express.Router();

// Optional auth helper
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
};

// Public discovery & invitations view
router.get('/public', organizationController.getPublicOrganizations);
router.get('/invitations/:token', organizationController.getInvitationByToken);
router.post('/invitations/reject', validate(acceptInvitationSchema), organizationController.rejectInvitation);

// Authenticated current user orgs & actions
router.post('/', authenticate, validate(createOrgSchema), organizationController.createOrganization);
router.get('/my', authenticate, organizationController.getMyOrganizations);
router.post('/invitations/accept', authenticate, validate(acceptInvitationSchema), organizationController.acceptInvitation);

// Public full company profile view
router.get('/:id/public-profile', optionalAuth, organizationController.getPublicProfile);

// Single organization overview
router.get('/:id', optionalAuth, organizationController.getOrganizationById);

// Update organization / company profile (Owner, Administrator, Editor)
router.put(
  '/:id',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  validate(updateOrgSchema),
  organizationController.updateOrganization
);

// Media Upload (Owner, Administrator, Editor)
router.post(
  '/:id/upload',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  upload.single('file'),
  organizationController.uploadMedia
);

// Company Studio (Owner, Administrator, Editor)
router.get(
  '/:id/studio',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.getStudioData
);

router.put(
  '/:id/studio',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.saveStudioData
);

// Follow / Unfollow organization
router.post('/:id/follow', authenticate, organizationController.followOrganization);
router.delete('/:id/follow', authenticate, organizationController.unfollowOrganization);

// Gallery management
router.post(
  '/:id/gallery',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.addGalleryItem
);

router.delete(
  '/:id/gallery/:imageId',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.removeGalleryItem
);

// Products & Solutions management
router.post(
  '/:id/products',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.addProduct
);

router.delete(
  '/:id/products/:productId',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.removeProduct
);

// Milestones management
router.post(
  '/:id/milestones',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.addMilestone
);

router.delete(
  '/:id/milestones/:milestoneId',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR]),
  organizationController.removeMilestone
);

// Member directory
router.get('/:id/members', authenticate, requireOrgMember, organizationController.getMembers);

// Invitation management (Owner, Administrator)
router.post(
  '/:id/invitations',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR]),
  validate(inviteMemberSchema),
  organizationController.inviteMember
);

router.get(
  '/:id/invitations',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR]),
  organizationController.getInvitations
);

router.delete(
  '/:id/invitations/:invitationId',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR]),
  organizationController.cancelInvitation
);

// Member role update (Owner, Administrator)
router.patch(
  '/:id/members/:membershipId/role',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR]),
  validate(updateMemberRoleSchema),
  organizationController.updateMemberRole
);

// Remove member (Owner, Administrator)
router.delete(
  '/:id/members/:membershipId',
  authenticate,
  requireOrgMember,
  requireOrgRole([ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR]),
  organizationController.removeMember
);

// Leave organization (any active member)
router.post('/:id/leave', authenticate, organizationController.leaveOrganization);

module.exports = router;
