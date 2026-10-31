import { Router } from 'express';
import { ReferralController } from './referral.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';

const router = Router();

// ─── User Routes ─────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, ReferralController.getDashboard);
router.post('/refund-request', authenticate, ReferralController.requestFeeRefund);

// ─── Admin Routes ────────────────────────────────────────────────────────────
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminGetReferrals
);

router.post(
  '/admin/:id/reverse',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminReverseReferral
);

router.get(
  '/admin/milestones',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminGetMilestones
);

router.get(
  '/admin/refunds',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminGetRefunds
);

router.post(
  '/admin/refunds/:id/review',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminProcessRefund
);

router.get(
  '/admin/policy',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminGetPolicy
);

router.put(
  '/admin/policy',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReferralController.adminUpdatePolicy
);

export const referralRoutes = router;
