const mongoose = require('mongoose');
const { ALL_ORG_ROLES, ORG_ROLES, MEMBERSHIP_STATUS } = require('../constants/roles');

const organizationMembershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ALL_ORG_ROLES,
      default: ORG_ROLES.MEMBER,
      required: true,
    },
    status: {
      type: String,
      enum: [MEMBERSHIP_STATUS.ACTIVE, MEMBERSHIP_STATUS.INACTIVE, MEMBERSHIP_STATUS.SUSPENDED],
      default: MEMBERSHIP_STATUS.ACTIVE,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    isPublicTeamMember: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    photo: {
      type: String,
      trim: true,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one membership per user per organization
organizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const OrganizationMembership = mongoose.model('OrganizationMembership', organizationMembershipSchema);

module.exports = OrganizationMembership;
