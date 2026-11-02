import { Router } from 'express';

import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { WithdrawalController } from './withdrawal.controller.js';

const router = Router();

// ─── User Routes ───────────────────────────────────────────────────────────────
router.post('/', authenticate, WithdrawalController.submitWithdrawal);
router.get('/me', authenticate, WithdrawalController.getMyWithdrawals);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.get(
  '/admin',
  authenticate,
  authorize(UserRole.ADMIN),
  WithdrawalController.getWithdrawalsAdmin
);
router.patch(
  '/admin/:withdrawalId/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  WithdrawalController.approveWithdrawal
);
router.patch(
  '/admin/:withdrawalId/complete',
  authenticate,
  authorize(UserRole.ADMIN),
  WithdrawalController.completeWithdrawal
);
router.patch(
  '/admin/:withdrawalId/reject',
  authenticate,
  authorize(UserRole.ADMIN),
  WithdrawalController.rejectWithdrawal
);
router.patch(
  '/admin/:withdrawalId/fail',
  authenticate,
  authorize(UserRole.ADMIN),
  WithdrawalController.failWithdrawal
);

export { router as withdrawalRoutes };

