import mongoose, { type Document, Schema } from 'mongoose';

export enum AnnouncementStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface IAnnouncement {
  title: string;
  content: string;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  isPinned: boolean;
  image?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  targetRoles: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IAnnouncementDocument = Document & IAnnouncement;

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, maxlength: 10000 },
    status: {
      type: String,
      enum: Object.values(AnnouncementStatus),
      default: AnnouncementStatus.DRAFT,
    },
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.NORMAL,
    },
    isPinned: { type: Boolean, default: false },
    image: { type: String },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    targetRoles: { type: [String], default: ['user', 'admin', 'super_admin'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ isPinned: 1, priority: 1 });
announcementSchema.index({ expiresAt: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
