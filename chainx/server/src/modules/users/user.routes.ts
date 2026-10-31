import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { UserController } from './user.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  submitRegistrationPaymentSchema,
} from './user.validation.js';

const router = Router();

// ─── Rate Limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created from this IP, please try again later.' },
});

// ─── Public Authentication Routes ──────────────────────────────────────────────
router.post('/register', registerLimiter, validate({ body: registerSchema }), UserController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), UserController.login);
router.post('/refresh', UserController.refresh);
router.post('/logout', UserController.logout);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), UserController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), UserController.resetPassword);
router.post('/verify-email', validate({ body: verifyEmailSchema }), UserController.verifyEmail);

// ─── Authenticated User Routes ─────────────────────────────────────────────────
router.get('/me', authenticate, UserController.getMe);
router.post(
  '/registration-payment',
  authenticate,
  validate({ body: submitRegistrationPaymentSchema }),
  UserController.submitRegistrationPayment
);
router.get('/sessions', authenticate, UserController.getSessions);
router.delete('/sessions/:sessionId', authenticate, UserController.revokeSession);
router.delete('/sessions', authenticate, UserController.revokeAllSessions);

export default router;
