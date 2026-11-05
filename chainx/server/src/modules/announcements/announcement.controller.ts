import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/index.js';
import { AnnouncementService } from './announcement.service.js';
import { AnnouncementStatus, AnnouncementPriority } from './announcement.model.js';

const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(300),
  content: z.string().min(5).max(10000),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  isPinned: z.boolean().optional(),
  image: z.string().url().optional().or(z.literal('')),
  targetRoles: z.array(z.string()).optional(),
  status: z.nativeEnum(AnnouncementStatus).optional(),
  expiresAt: z.string().optional(),
});

export class AnnouncementController {
  // Public / User
  static async getActiveAnnouncements(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const announcements = await AnnouncementService.getActiveAnnouncements(authUser?.role || 'user');
    res.json({ success: true, data: announcements });
  }

  // Admin
  static async getAnnouncementsAdmin(req: Request, res: Response) {
    const { status, page, limit } = req.query;
    const result = await AnnouncementService.getAnnouncementsAdmin({
      ...(status ? { status: String(status) } : {}),
      page: Number(page || 1),
      limit: Number(limit || 20),
    });
    res.json({ success: true, ...result });
  }

  static async createAnnouncement(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const data = createAnnouncementSchema.parse(req.body);
    const announcement = await AnnouncementService.createAnnouncement(authUser.userId, {
      title: data.title,
      content: data.content,
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
      ...(data.image ? { image: data.image } : {}),
      ...(data.targetRoles ? { targetRoles: data.targetRoles } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
    });
    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement,
    });
  }

  static async updateAnnouncement(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const data = createAnnouncementSchema.partial().parse(req.body);
    const announcement = await AnnouncementService.updateAnnouncement(id, authUser.userId, data as any);
    res.json({
      success: true,
      message: 'Announcement updated successfully.',
      data: announcement,
    });
  }

  static async deleteAnnouncement(req: Request, res: Response) {
    const { id } = req.params;
    await AnnouncementService.deleteAnnouncement(id);
    res.json({ success: true, message: 'Announcement deleted.' });
  }
}

