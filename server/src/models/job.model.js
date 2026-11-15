const mongoose = require('mongoose');

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Co-founder',
];

const WORKPLACE_TYPES = ['Remote', 'Hybrid', 'On-site'];

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

const JOB_STATUSES = ['Draft', 'Published', 'Closed', 'Expired'];

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: 'Full-time',
      required: true,
      index: true,
    },
    workplaceType: {
      type: String,
      enum: WORKPLACE_TYPES,
      default: 'Remote',
      required: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    experience: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: 'Mid',
      index: true,
    },
    salary: {
      currency: { type: String, default: 'USD' },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      period: {
        type: String,
        enum: ['yearly', 'monthly', 'hourly'],
        default: 'yearly',
      },
      equity: { type: String, trim: true, default: '' },
      isDisclosed: { type: Boolean, default: true },
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    perks: [
      {
        type: String,
        trim: true,
      },
    ],
    applicationType: {
      type: String,
      enum: ['external_url', 'email'],
      default: 'external_url',
    },
    applicationUrl: {
      type: String,
      required: [true, 'Application URL or contact email is required'],
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'Published',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    postedBy: {
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

jobSchema.index({ title: 'text', requiredSkills: 'text', description: 'text' });
jobSchema.index({ status: 1, employmentType: 1, workplaceType: 1 });
jobSchema.index({
  status: 1,
  employmentType: 1,
  workplaceType: 1,
  experience: 1,
  expiryDate: 1,
});

const Job = mongoose.model('Job', jobSchema);

module.exports = {
  Job,
  EMPLOYMENT_TYPES,
  WORKPLACE_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
};
