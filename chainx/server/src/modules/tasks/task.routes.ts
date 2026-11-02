import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../types/index.js';
import { TaskController } from './task.controller.js';

const router = Router();

// ─── USER ROUTES ─────────────────────────────────────────────────────────────
router.get('/', authenticate, TaskController.getAvailableTasks);
router.get('/earnings', authenticate, TaskController.getUserTaskEarnings);
router.get('/me/submissions', authenticate, TaskController.getMySubmissions);
router.get('/:id', authenticate, TaskController.getTaskById);
router.post('/:id/submit', authenticate, TaskController.submitTask);

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────
router.get(
  '/admin/overview',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.getTaskSystemOverview
);
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.getAllTasksAdmin
);
router.post(
  '/admin/create',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.createTask
);
router.put(
  '/admin/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.updateTask
);
router.patch(
  '/admin/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.updateTaskStatus
);
router.get(
  '/admin/submissions/all',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.getSubmissionsAdmin
);
router.patch(
  '/admin/submissions/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.approveSubmission
);
router.patch(
  '/admin/submissions/:id/reject',
  authenticate,
  authorize(UserRole.ADMIN),
  TaskController.rejectSubmission
);

export { router as taskRoutes };
