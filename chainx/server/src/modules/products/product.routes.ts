import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { ProductController } from './product.controller.js';

const router = Router();

// ─── Public / Client Endpoints ──────────────────────────────────────────────────
router.get('/', ProductController.getProducts);
router.get('/:slug', ProductController.getProductDetails);

// ─── Authenticated User Order Endpoints ─────────────────────────────────────────
router.post('/orders', authenticate, ProductController.placeOrder);
router.get('/orders/my-orders', authenticate, ProductController.getUserOrders);

// ─── Admin Endpoints ────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, requireAdmin, ProductController.adminGetProducts);
router.post('/admin', authenticate, requireAdmin, ProductController.adminCreateProduct);
router.put('/admin/:id', authenticate, requireAdmin, ProductController.adminUpdateProduct);
router.delete('/admin/:id', authenticate, requireAdmin, ProductController.adminArchiveProduct);
router.patch('/admin/:id/toggle-status', authenticate, requireAdmin, ProductController.adminToggleStatus);

// Admin order routes
router.get('/admin/orders/all', authenticate, requireAdmin, ProductController.adminGetOrders);
router.patch(
  '/admin/orders/:id/fulfillment',
  authenticate,
  requireAdmin,
  ProductController.adminUpdateOrderFulfillment
);

export default router;
