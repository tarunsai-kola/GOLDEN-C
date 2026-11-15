const mongoose = require('mongoose');
const { ALL_ORG_TYPES, ORG_STATUS, ORG_TYPES } = require('../constants/roles');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ALL_ORG_TYPES,
      default: ORG_TYPES.COMPANY,
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [ORG_STATUS.ACTIVE, ORG_STATUS.PENDING_VERIFICATION, ORG_STATUS.SUSPENDED],
      default: ORG_STATUS.ACTIVE,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

organizationSchema.index({ name: 'text', location: 'text' });
organizationSchema.index({ slug: 1 });
organizationSchema.index({ createdBy: 1 });
organizationSchema.index({ location: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ type: 1 });

// Virtual for company profile
organizationSchema.virtual('profile', {
  ref: 'CompanyProfile',
  localField: '_id',
  foreignField: 'organizationId',
  justOne: true,
});

// Virtual for members count
organizationSchema.virtual('memberships', {
  ref: 'OrganizationMembership',
  localField: '_id',
  foreignField: 'organizationId',
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
