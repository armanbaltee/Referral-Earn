import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { AnnouncementController } from './announcement.controller.js';

const router = Router();

// User & Public active feed
router.get('/active', authenticate, AnnouncementController.getActiveAnnouncements);

// Admin routes
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.ADMIN),
  AnnouncementController.getAnnouncementsAdmin
);
router.post(
  '/admin',
  authenticate,
  authorize(UserRole.ADMIN),
  AnnouncementController.createAnnouncement
);
router.put(
  '/admin/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  AnnouncementController.updateAnnouncement
);
router.delete(
  '/admin/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  AnnouncementController.deleteAnnouncement
);

export { router as announcementRoutes };

