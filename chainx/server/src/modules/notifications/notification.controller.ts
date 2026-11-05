import type { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';

export class NotificationController {
  public static async getMyNotifications(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const { page, limit, isRead, type } = req.query;

    const result = await NotificationService.getUserNotifications(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type: type ? String(type) : undefined,
    });

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      meta: result.meta,
    });
  }

  public static async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({
      success: true,
      unreadCount: count,
    });
  }

  public static async markAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const notificationId = req.params.id as string;
    const notification = await NotificationService.markAsRead(userId, notificationId);

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  }

  public static async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const result = await NotificationService.markAllAsRead(userId);
    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read.`,
    });
  }

  public static async deleteNotification(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const notificationId = req.params.id as string;
    const deleted = await NotificationService.deleteNotification(userId, notificationId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification removed.',
    });
  }
}

