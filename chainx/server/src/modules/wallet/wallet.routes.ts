import { Router } from 'express';

import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { WalletController } from './wallet.controller.js';

const router = Router();

// ─── User Routes ───────────────────────────────────────────────────────────────
router.get('/me', authenticate, WalletController.getMyWallet);
router.get('/me/transactions', authenticate, WalletController.getMyTransactions);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.get(
  '/admin',
  authenticate,
  authorize(UserRole.ADMIN),
  WalletController.getWalletsAdmin
);
router.get(
  '/admin/ledger',
  authenticate,
  authorize(UserRole.ADMIN),
  WalletController.getAdminLedger
);
router.get(
  '/admin/summary',
  authenticate,
  authorize(UserRole.ADMIN),
  WalletController.getFinancialSummary
);
router.get(
  '/admin/user/:userId',
  authenticate,
  authorize(UserRole.ADMIN),
  WalletController.getUserWallet
);
router.post(
  '/admin/user/:userId/adjust',
  authenticate,
  authorize(UserRole.ADMIN),
  WalletController.adminAdjustment
);

export { router as walletRoutes };

