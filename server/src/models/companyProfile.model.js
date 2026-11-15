const mongoose = require('mongoose');

const DEFAULT_SECTIONS = [
  { key: 'about', title: 'About & Story', isVisible: true, order: 0 },
  { key: 'products', title: 'Products & Solutions', isVisible: true, order: 1 },
  { key: 'gallery', title: 'Photo Gallery', isVisible: true, order: 2 },
  { key: 'milestones', title: 'Key Milestones', isVisible: true, order: 3 },
  { key: 'team', title: 'Team & Leadership', isVisible: true, order: 4 },
  { key: 'media', title: 'Press & Media', isVisible: true, order: 5 },
  { key: 'contact', title: 'Contact & Connect', isVisible: true, order: 6 },
];

const companyProfileSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [4000, 'Description cannot exceed 4000 characters'],
    },
    industry: {
      type: String,
      trim: true,
      default: 'Technology',
    },
    foundedYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
      default: () => new Date().getFullYear(),
    },
    companyStage: {
      type: String,
      trim: true,
      default: 'Seed',
    },
    teamSize: {
      type: String,
      trim: true,
      default: '1-10',
    },
    isHiring: {
      type: Boolean,
      default: false,
      index: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    problemSolved: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Problem solved cannot exceed 2000 characters'],
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Target audience cannot exceed 1000 characters'],
    },
    mission: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1500, 'Mission cannot exceed 1500 characters'],
    },
    vision: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1500, 'Vision cannot exceed 1500 characters'],
    },
    products: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: '' },
        image: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: 'Software' },
        link: { type: String, trim: true, default: '' },
        status: { type: String, trim: true, default: 'Live' },
      },
    ],
    milestones: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: '' },
        date: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: 'Company' },
      },
    ],
    gallery: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true, trim: true },
        caption: { type: String, trim: true, default: '' },
        category: {
          type: String,
          enum: ['office', 'product', 'team', 'event'],
          default: 'office',
        },
        order: { type: Number, default: 0 },
      },
    ],
    updates: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        content: { type: String, trim: true, default: '' },
        date: { type: Date, default: Date.now },
        link: { type: String, trim: true, default: '' },
      },
    ],
    mediaFeatures: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        type: {
          type: String,
          enum: ['press', 'video', 'podcast', 'interview'],
          default: 'press',
        },
        url: { type: String, trim: true, default: '' },
        publisher: { type: String, trim: true, default: '' },
        date: { type: String, trim: true, default: '' },
      },
    ],
    socialLinks: {
      linkedin: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    contactInfo: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      contactPerson: { type: String, trim: true, default: '' },
    },
    sectionOrder: {
      type: [
        {
          key: { type: String, required: true },
          title: { type: String, required: true },
          isVisible: { type: Boolean, default: true },
          order: { type: Number, default: 0 },
        },
      ],
      default: DEFAULT_SECTIONS,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    draftData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

companyProfileSchema.index({ industry: 1 });
companyProfileSchema.index({ companyStage: 1 });
companyProfileSchema.index({ foundedYear: 1 });
companyProfileSchema.index({ teamSize: 1 });
companyProfileSchema.index({ industry: 1, companyStage: 1, isHiring: 1 });
companyProfileSchema.index({ tagline: 'text', description: 'text', problemSolved: 'text' });

const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);

module.exports = CompanyProfile;
