import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { NotificationController } from './notification.controller.js';

const router = Router();

// Protect all notification routes
router.use(authenticate);

router.get('/', NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.deleteNotification);

export { router as notificationRoutes };

