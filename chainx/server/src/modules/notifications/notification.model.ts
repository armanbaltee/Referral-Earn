import mongoose, { type Document, Schema } from 'mongoose';

export enum NotificationType {
  // Phase 9 Required Types
  REGISTRATION_SUCCESS = 'registration_success',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCOUNT_VERIFIED = 'account_verified',
  REFERRAL_REGISTERED = 'referral_registered',
  REFERRAL_COMMISSION_APPROVED = 'referral_commission_approved',
  MILESTONE_ACHIEVED = 'milestone_achieved',
  REFUND_ELIGIBLE = 'refund_eligible',
  REFUND_COMPLETED = 'refund_completed',
  DEPOSIT_APPROVED = 'deposit_approved',
  DEPOSIT_REJECTED = 'deposit_rejected',
  WITHDRAWAL_APPROVED = 'withdrawal_approved',
  WITHDRAWAL_COMPLETED = 'withdrawal_completed',
  WITHDRAWAL_REJECTED = 'withdrawal_rejected',
  TASK_ASSIGNED = 'task_assigned',
  TASK_SUBMISSION_APPROVED = 'task_submission_approved',
  TASK_SUBMISSION_REJECTED = 'task_submission_rejected',
  TASK_REWARD_CREDITED = 'task_reward_credited',
  NEW_ANNOUNCEMENT = 'new_announcement',

  // General Categories
  SYSTEM = 'system',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
  TASK = 'task',
  REFERRAL = 'referral',
  ORDER = 'order',
  SECURITY = 'security',
  ANNOUNCEMENT = 'announcement',
}

export interface INotification {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date | undefined;
  link?: string | undefined;
  referenceId?: string | undefined;
  referenceModel?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type INotificationDocument = Document & INotification;

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String },
    referenceId: { type: String },
    referenceModel: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
