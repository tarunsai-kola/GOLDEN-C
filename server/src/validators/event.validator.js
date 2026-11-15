const { z } = require('zod');
const {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  EVENT_STATUSES,
  ORGANIZER_TYPES,
} = require('../models/event.model');
const { validate } = require('./auth.validator');

const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Event title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Event description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().trim().max(300).optional().default(''),
  coverImage: z.string().trim().optional().default(''),
  category: z.enum(EVENT_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${EVENT_CATEGORIES.join(', ')}` }),
  }),
  tags: z.array(z.string().trim()).optional().default([]),
  speakers: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Speaker name is required'),
        title: z.string().trim().optional().default(''),
        company: z.string().trim().optional().default(''),
        avatar: z.string().trim().optional().default(''),
        bio: z.string().trim().optional().default(''),
        linkedin: z.string().trim().optional().default(''),
      })
    )
    .optional()
    .default([]),
  organizerType: z.enum(ORGANIZER_TYPES).optional().default('Company'),
  organizationId: z.string().nullable().optional(),
  date: z.string({ required_error: 'Event date is required' }),
  startTime: z.string({ required_error: 'Start time is required' }),
  endTime: z.string().trim().optional().default(''),
  timeZone: z.string().trim().optional().default('UTC'),
  language: z.string().trim().optional().default('English'),
  format: z.enum(EVENT_FORMATS).optional().default('Online'),
  venue: z
    .object({
      name: z.string().trim().optional().default(''),
      address: z.string().trim().optional().default(''),
      city: z.string().trim().optional().default(''),
      state: z.string().trim().optional().default(''),
      country: z.string().trim().optional().default(''),
      mapLink: z.string().trim().optional().default(''),
    })
    .optional(),
  meetingUrl: z.string().trim().optional().default(''),
  registrationUrl: z.string().trim().optional().default(''),
  pricingType: z.enum(['Free', 'Paid']).optional().default('Free'),
  price: z.coerce.number().min(0).optional().default(0),
  currency: z.string().trim().optional().default('USD'),
  capacity: z.coerce.number().min(1).optional().default(100),
  audience: z.string().trim().optional().default('All Founders & Investors'),
  registrationDeadline: z.string().nullable().optional(),
  showAttendeesPublicly: z.boolean().optional().default(true),
});

const updateEventSchema = createEventSchema.partial();

const eventStatusSchema = z.object({
  status: z.enum(EVENT_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${EVENT_STATUSES.join(', ')}` }),
  }),
  rejectionReason: z.string().trim().optional().default(''),
});

const eventFeedbackSchema = z.object({
  rating: z.coerce.number().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().trim().max(1000).optional().default(''),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  eventStatusSchema,
  eventFeedbackSchema,
  validate,
};
