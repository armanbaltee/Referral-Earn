import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { AdminController } from './admin.controller.js';

const router = Router();

// Protect all platform admin routes
router.use(authenticate, authorize(UserRole.ADMIN));

// Overview analytics
router.get('/dashboard/overview', AdminController.getDashboardOverview);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

// System settings
router.get('/settings', AdminController.getPlatformSettings);
router.put('/settings/registration-fee', AdminController.updateRegistrationFeeConfig);
router.put('/settings/referral-policy', AdminController.updateReferralPolicy);
router.put('/settings/general', AdminController.updateGeneralConfig);

// Reports CSV export
router.get('/reports/:type', AdminController.exportReport);

// Suspicious referrals detection
router.get('/referrals/suspicious', AdminController.getSuspiciousReferrals);

export { router as adminRoutes };

