const { z } = require('zod');
const {
  EMPLOYMENT_TYPES,
  WORKPLACE_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
} = require('../models/job.model');
const { validate } = require('./auth.validator');

const salarySchema = z
  .object({
    currency: z.string().trim().optional().default('USD'),
    min: z.number().nullable().optional().default(null),
    max: z.number().nullable().optional().default(null),
    period: z.enum(['yearly', 'monthly', 'hourly']).optional().default('yearly'),
    equity: z.string().trim().optional().default(''),
    isDisclosed: z.boolean().optional().default(true),
  })
  .optional()
  .default({});

const createJobSchema = z.object({
  title: z
    .string({ required_error: 'Job title is required' })
    .trim()
    .min(2, 'Job title must be at least 2 characters')
    .max(150, 'Job title cannot exceed 150 characters'),
  organizationId: z
    .string({ required_error: 'Organization ID is required' })
    .trim()
    .min(1, 'Organization ID is required'),
  description: z
    .string({ required_error: 'Job description is required' })
    .trim()
    .min(10, 'Job description must be at least 10 characters'),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().default('Full-time'),
  workplaceType: z.enum(WORKPLACE_TYPES).optional().default('Remote'),
  location: z.string().trim().optional().default(''),
  experience: z.enum(EXPERIENCE_LEVELS).optional().default('Mid'),
  salary: salarySchema,
  requiredSkills: z.array(z.string().trim()).optional().default([]),
  perks: z.array(z.string().trim()).optional().default([]),
  applicationType: z.enum(['external_url', 'email']).optional().default('external_url'),
  applicationUrl: z
    .string({ required_error: 'Application URL or contact email is required' })
    .trim()
    .min(1, 'Application URL or contact email cannot be empty'),
  expiryDate: z.string().or(z.date()).optional(),
  status: z.enum(JOB_STATUSES).optional().default('Published'),
});

const updateJobSchema = createJobSchema.partial().omit({ organizationId: true });

const jobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${JOB_STATUSES.join(', ')}` }),
  }),
});

const jobReportSchema = z.object({
  reason: z
    .string({ required_error: 'Report reason is required' })
    .trim()
    .min(2, 'Reason must be at least 2 characters')
    .max(200, 'Reason cannot exceed 200 characters'),
  details: z.string().trim().max(1000).optional().default(''),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobStatusSchema,
  jobReportSchema,
  validate,
};
