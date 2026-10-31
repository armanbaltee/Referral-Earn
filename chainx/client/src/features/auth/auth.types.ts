import { z } from 'zod';

// ─── Registration Schema ───────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string()
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(
        /^(?:\+92|0)?3[0-9]{9}$|^\+?[1-9]\d{7,14}$/,
        'Please enter a valid phone number (e.g., 03001234567 or +923001234567)'
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .or(z.literal('')),
    termsAccepted: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms, conditions, and Rs. 15,000 registration fee requirement',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Login Schema ──────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Password Reset Schemas ────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Email Verification Schema ─────────────────────────────────────────────────
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
