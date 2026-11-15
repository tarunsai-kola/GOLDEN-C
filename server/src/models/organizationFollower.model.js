const mongoose = require('mongoose');

const organizationFollowerSchema = new mongoose.Schema(
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Prevent duplicate follows
organizationFollowerSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const OrganizationFollower = mongoose.model('OrganizationFollower', organizationFollowerSchema);

module.exports = OrganizationFollower;
