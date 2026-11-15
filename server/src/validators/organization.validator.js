const { z } = require('zod');
const { ALL_ORG_ROLES, ALL_ORG_TYPES } = require('../constants/roles');
const { validate } = require('./auth.validator');

const createOrgSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name cannot exceed 120 characters'),
  type: z.enum(ALL_ORG_TYPES).optional().default('company'),
  logo: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  website: z.string().trim().optional().default(''),
  // Profile fields
  tagline: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().max(3000).optional().default(''),
  industry: z.string().trim().optional().default('Technology'),
  foundedYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  companyStage: z.string().trim().optional().default('Seed'),
  teamSize: z.string().trim().optional().default('1-10'),
  isHiring: z.boolean().optional().default(false),
  socialLinks: z
    .object({
      linkedin: z.string().trim().optional().default(''),
      twitter: z.string().trim().optional().default(''),
      github: z.string().trim().optional().default(''),
      website: z.string().trim().optional().default(''),
    })
    .optional(),
});

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: z.enum(ALL_ORG_TYPES).optional(),
  logo: z.string().trim().optional(),
  location: z.string().trim().optional(),
  website: z.string().trim().optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(3000).optional(),
  industry: z.string().trim().optional(),
  foundedYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  companyStage: z.string().trim().optional(),
  teamSize: z.string().trim().optional(),
  isHiring: z.boolean().optional(),
  socialLinks: z
    .object({
      linkedin: z.string().trim().optional(),
      twitter: z.string().trim().optional(),
      github: z.string().trim().optional(),
      website: z.string().trim().optional(),
    })
    .optional(),
});

const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Invitee email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  role: z.enum(ALL_ORG_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${ALL_ORG_ROLES.join(', ')}` }),
  }),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(ALL_ORG_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${ALL_ORG_ROLES.join(', ')}` }),
  }),
});

const acceptInvitationSchema = z.object({
  token: z.string({ required_error: 'Invitation token is required' }).trim().min(1),
});

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
  validate,
};
