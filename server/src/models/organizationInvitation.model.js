const mongoose = require('mongoose');
const { ALL_ORG_ROLES, ORG_ROLES, INVITATION_STATUS } = require('../constants/roles');

const organizationInvitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Invitee email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    role: {
      type: String,
      enum: ALL_ORG_ROLES,
      default: ORG_ROLES.MEMBER,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    status: {
      type: String,
      enum: [
        INVITATION_STATUS.PENDING,
        INVITATION_STATUS.ACCEPTED,
        INVITATION_STATUS.REJECTED,
        INVITATION_STATUS.CANCELED,
        INVITATION_STATUS.EXPIRED,
      ],
      default: INVITATION_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

organizationInvitationSchema.index({ organizationId: 1, email: 1 });

const OrganizationInvitation = mongoose.model('OrganizationInvitation', organizationInvitationSchema);

module.exports = OrganizationInvitation;
