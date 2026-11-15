const { z } = require('zod');
const { validate } = require('./auth.validator');

const createConversationSchema = z.object({
  recipientId: z
    .string({ required_error: 'Recipient user ID is required' })
    .trim()
    .min(1, 'Recipient user ID is required'),
});

const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message cannot exceed 5000 characters'),
});

const reportMessageSchema = z.object({
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(2, 'Reason must be at least 2 characters')
    .max(300, 'Reason cannot exceed 300 characters'),
});

const blockUserSchema = z.object({
  reason: z.string().trim().max(300).optional().default(''),
});

module.exports = {
  createConversationSchema,
  sendMessageSchema,
  reportMessageSchema,
  blockUserSchema,
  validate,
};
