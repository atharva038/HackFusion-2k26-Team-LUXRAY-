import { z } from 'zod';

/**
 * validate — Express middleware factory that validates req.body against a Zod schema.
 * On failure: returns 400 with the first validation error message.
 * On success: replaces req.body with the coerced/sanitised data.
 *
 * Usage:
 *   router.post('/chat', protect, validate(chatSchema), chatController.handleMessage);
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return res.status(400).json({
      error: firstError.message,
      field: firstError.path.join('.'),
    });
  }
  req.body = result.data; // Sanitised and type-coerced
  next();
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

/**
 * Chat message schema — validates and trims user messages.
 */
export const chatSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (max 1000 characters)'),
  sessionId: z.string().nullable().optional(),
  language: z.enum(['en', 'hi', 'mr']).optional().default('en'),
});

/**
 * Auth login schema
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Auth register schema
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'pharmacist', 'admin']).optional().default('customer'),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

/**
 * Restock schema for admin inventory
 */
export const restockSchema = z.object({
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive'),
});

/**
 * Order status update schema
 */
export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'dispensed', 'rejected'], {
    required_error: 'Status is required',
  }),
  rejectionReason: z.string().trim().optional(),
});
