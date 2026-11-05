import mongoose from 'mongoose';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementPriority,
  type IAnnouncementDocument,
} from './announcement.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { BadRequestError, NotFoundError } from '../../common/errors.js';

export interface CreateAnnouncementDTO {
  title: string;
  content: string;
  priority?: AnnouncementPriority | undefined;
  isPinned?: boolean | undefined;
  image?: string | undefined;
  targetRoles?: string[] | undefined;
  status?: AnnouncementStatus | undefined;
  expiresAt?: string | undefined;
}

export class AnnouncementService {
  public static async createAnnouncement(adminId: string, data: CreateAnnouncementDTO): Promise<IAnnouncementDocument> {
    if (!data.title?.trim() || !data.content?.trim()) {
      throw new BadRequestError('Title and content are required.');
    }

    const announcement = await Announcement.create({
      title: data.title.trim(),
      content: data.content.trim(),
      priority: data.priority || AnnouncementPriority.NORMAL,
      isPinned: data.isPinned || false,
      image: data.image,
      targetRoles: data.targetRoles || ['user', 'admin', 'super_admin'],
      status: data.status || AnnouncementStatus.PUBLISHED,
      publishedAt: data.status === AnnouncementStatus.PUBLISHED ? new Date() : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.ANNOUNCEMENT_PUBLISHED,
      target: announcement._id,
      targetModel: 'Announcement',
      description: `Announcement created: "${announcement.title}" (Status: ${announcement.status})`,
    });

    return announcement;
  }

  public static async updateAnnouncement(id: string, _adminId: string, data: Partial<CreateAnnouncementDTO>): Promise<IAnnouncementDocument> {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found.');
    }

    if (data.title) announcement.title = data.title.trim();
    if (data.content) announcement.content = data.content.trim();
    if (data.priority) announcement.priority = data.priority;
    if (data.isPinned !== undefined) announcement.isPinned = data.isPinned;
    if (data.image !== undefined) announcement.image = data.image;
    if (data.targetRoles) announcement.targetRoles = data.targetRoles;
    if (data.status) {
      if (data.status === AnnouncementStatus.PUBLISHED && announcement.status !== AnnouncementStatus.PUBLISHED) {
        announcement.publishedAt = new Date();
      }
      announcement.status = data.status;
    }
    if (data.expiresAt !== undefined) {
      if (data.expiresAt) announcement.expiresAt = new Date(data.expiresAt);
      else (announcement as any).expiresAt = undefined;
    }

    await announcement.save();
    return announcement;
  }

  public static async deleteAnnouncement(id: string): Promise<void> {
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found.');
    }
  }

  public static async getAnnouncementsAdmin(query: { status?: string | undefined; page?: number | undefined; limit?: number | undefined }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'name email')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    return {
      announcements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  public static async getActiveAnnouncements(userRole: string = 'user') {
    const filter: Record<string, unknown> = {
      status: AnnouncementStatus.PUBLISHED,
      targetRoles: userRole,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    return Announcement.find(filter)
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(10)
      .lean();
  }
}
