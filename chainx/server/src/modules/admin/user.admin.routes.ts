import { Router } from 'express';

import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserController } from '../users/user.controller.js';
import {
  adminUserQuerySchema,
  adminSuspendUserSchema,
  adminConfirmPaymentSchema,
} from '../users/user.validation.js';

const router = Router();

// Protect all admin user routes
router.use(authenticate, requireAdmin);

router.get('/', validate({ query: adminUserQuerySchema }), UserController.adminGetUsers);
router.get('/:id', UserController.adminGetUserDetails);
router.post('/:id/suspend', validate({ body: adminSuspendUserSchema }), UserController.adminSuspendUser);
router.post('/:id/reactivate', UserController.adminReactivateUser);
router.post(
  '/:id/confirm-payment',
  validate({ body: adminConfirmPaymentSchema }),
  UserController.adminConfirmPayment
);

export default router;
