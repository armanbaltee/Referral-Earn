import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { RegistrationPaymentController } from './registrationPayment.controller.js';

const router = Router();

// ─── Public / Client Endpoints ──────────────────────────────────────────────────
router.get('/config', RegistrationPaymentController.getConfig);
router.post('/callback/:gateway', RegistrationPaymentController.handleCallback);

// ─── Authenticated User Endpoints ───────────────────────────────────────────────
router.get('/status', authenticate, RegistrationPaymentController.getUserStatus);
router.post('/manual', authenticate, RegistrationPaymentController.submitManual);
router.post('/initiate-automated', authenticate, RegistrationPaymentController.initiateAutomated);

// ─── Admin Endpoints ────────────────────────────────────────────────────────────
router.get('/admin', authenticate, requireAdmin, RegistrationPaymentController.adminGetPayments);
router.post('/admin/:id/approve', authenticate, requireAdmin, RegistrationPaymentController.adminApprove);
router.post('/admin/:id/reject', authenticate, requireAdmin, RegistrationPaymentController.adminReject);
router.put('/admin/config', authenticate, requireAdmin, RegistrationPaymentController.adminUpdateConfig);

export default router;
