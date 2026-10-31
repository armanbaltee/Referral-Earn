import { z } from 'zod';
import { AccountStatus, RegistrationPaymentStatus } from './user.types.js';

// Password complexity: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
const phoneRegex = /^\+?[0-9]{9,15}$/;

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, 'Invalid phone number format (e.g. +923001234567 or 03001234567)'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&_-#)'
      ),
    confirmPassword: z.string({ required_error: 'Password confirmation is required' }),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Referral code must be at least 3 characters')
      .max(25, 'Referral code cannot exceed 25 characters')
      .optional()
      .or(z.literal('')),
    termsAccepted: z
      .boolean({ required_error: 'You must accept the terms and conditions' })
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: 'Reset token is required' }).min(1, 'Token is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
      ),
    confirmPassword: z.string({ required_error: 'Password confirmation is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'Verification token is required' }).min(1, 'Token is required'),
});

export const verifyPhoneSchema = z.object({
  phone: z.string({ required_error: 'Phone number is required' }).regex(phoneRegex, 'Invalid phone number'),
  code: z.string({ required_error: 'Verification code is required' }).min(4, 'Code must be at least 4 digits'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
      ),
    confirmPassword: z.string({ required_error: 'Password confirmation is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  paymentStatus: z.nativeEnum(RegistrationPaymentStatus).optional(),
  role: z.enum(['user', 'admin']).optional(),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const adminSuspendUserSchema = z.object({
  reason: z
    .string({ required_error: 'A reason for suspension is required' })
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const adminConfirmPaymentSchema = z.object({
  transactionId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const submitRegistrationPaymentSchema = z.object({
  paymentMethod: z.enum(['jazzcash', 'easypaisa', 'bank_transfer', 'manual']),
  paymentReference: z.string().trim().min(3, 'Transaction reference/ID is required'),
  proofImage: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

