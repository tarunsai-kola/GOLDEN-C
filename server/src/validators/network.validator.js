const { z } = require('zod');
const { validate } = require('./auth.validator');

const connectSchema = z.object({
  note: z.string().trim().max(300, 'Note cannot exceed 300 characters').optional().default(''),
});

module.exports = {
  connectSchema,
  validate,
};
