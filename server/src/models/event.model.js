const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Pitch Event',
  'Masterclass',
  'Networking',
  'Hackathon',
  'Webinar',
  'Panel',
  'Conference',
];

const EVENT_FORMATS = ['Online', 'Offline', 'Hybrid'];

const EVENT_STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Published',
  'Cancelled',
  'Completed',
];

const ORGANIZER_TYPES = ['Golden Circle', 'Company', 'Partner', 'Independent'];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      default: 'Webinar',
      required: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    speakers: [
      {
        name: { type: String, required: true, trim: true },
        title: { type: String, trim: true, default: '' },
        company: { type: String, trim: true, default: '' },
        avatar: { type: String, trim: true, default: '' },
        bio: { type: String, trim: true, default: '' },
        linkedin: { type: String, trim: true, default: '' },
      },
    ],
    organizerType: {
      type: String,
      enum: ORGANIZER_TYPES,
      default: 'Company',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
    timeZone: {
      type: String,
      trim: true,
      default: 'UTC',
    },
    language: {
      type: String,
      trim: true,
      default: 'English',
    },
    format: {
      type: String,
      enum: EVENT_FORMATS,
      default: 'Online',
      index: true,
    },
    venue: {
      name: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      mapLink: { type: String, trim: true, default: '' },
    },
    meetingUrl: {
      type: String,
      trim: true,
      default: '',
    },
    registrationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    pricingType: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free',
      index: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    capacity: {
      type: Number,
      default: 100,
    },
    attendeeCount: {
      type: Number,
      default: 0,
    },
    audience: {
      type: String,
      trim: true,
      default: 'All Founders & Investors',
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'Submitted',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    showAttendeesPublicly: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    feedback: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ slug: 1 });
eventSchema.index({ organizationId: 1 });
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizerType: 1, status: 1 });
eventSchema.index({ isOfficialGoldenCircle: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = {
  Event,
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  EVENT_STATUSES,
  ORGANIZER_TYPES,
};
