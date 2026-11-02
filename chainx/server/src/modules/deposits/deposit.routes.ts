import { Router } from 'express';

import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { DepositController } from './deposit.controller.js';

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────────
router.get('/instructions', authenticate, DepositController.getPaymentInstructions);

// ─── User Routes ───────────────────────────────────────────────────────────────
router.post('/', authenticate, DepositController.submitDeposit);
router.get('/me', authenticate, DepositController.getMyDeposits);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin', authenticate, authorize(UserRole.ADMIN), DepositController.getDepositsAdmin);
router.patch(
  '/admin/:depositId/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  DepositController.approveDeposit
);
router.patch(
  '/admin/:depositId/reject',
  authenticate,
  authorize(UserRole.ADMIN),
  DepositController.rejectDeposit
);

export { router as depositRoutes };

