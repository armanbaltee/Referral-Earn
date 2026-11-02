import mongoose, { type Document, Schema } from 'mongoose';

export enum AuditAction {
  // Auth
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  PASSWORD_CHANGED = 'user.password_changed',
  // Admin financial actions
  DEPOSIT_APPROVED = 'deposit.approved',
  DEPOSIT_REJECTED = 'deposit.rejected',
  DEPOSIT_COMPLETED = 'deposit.completed',
  WITHDRAWAL_APPROVED = 'withdrawal.approved',
  WITHDRAWAL_REJECTED = 'withdrawal.rejected',
  WITHDRAWAL_COMPLETED = 'withdrawal.completed',
  WITHDRAWAL_FAILED = 'withdrawal.failed',
  REFUND_APPROVED = 'refund.approved',
  REFUND_REJECTED = 'refund.rejected',
  WALLET_ADJUSTED = 'wallet.adjusted',
  WALLET_LOCKED = 'wallet.locked',
  WALLET_UNLOCKED = 'wallet.unlocked',
  // Admin user actions
  USER_ACTIVATED = 'user.activated',
  USER_DEACTIVATED = 'user.deactivated',
  USER_ROLE_CHANGED = 'user.role_changed',
  SYSTEM_CONFIG_UPDATED = 'system.config_updated',
  REGISTRATION_PAYMENT_APPROVED = 'registration.payment_approved',
  REGISTRATION_PAYMENT_REJECTED = 'registration.payment_rejected',
  REFERRAL_REVERSED = 'referral.reversed',
  MILESTONE_ACHIEVED = 'milestone.achieved',
  FEE_REFUND_APPROVED = 'fee_refund.approved',
  FEE_REFUND_REJECTED = 'fee_refund.rejected',
  FEE_REFUND_COMPLETED = 'fee_refund.completed',
  // Content
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_STATUS_CHANGED = 'task.status_changed',
  TASK_SUBMISSION_REVIEWED = 'task.submission_reviewed',
  TASK_SUBMISSION_APPROVED = 'task.submission_approved',
  TASK_SUBMISSION_REJECTED = 'task.submission_rejected',
  ANNOUNCEMENT_PUBLISHED = 'announcement.published',
}

export interface IAuditLog {
  actor: mongoose.Types.ObjectId;
  action: AuditAction;
  target?: mongoose.Types.ObjectId;
  targetModel?: string;
  description: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export type IAuditLogDocument = Document & IAuditLog;

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    target: { type: Schema.Types.ObjectId },
    targetModel: { type: String },
    description: { type: String, required: true, maxlength: 1000 },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ actor: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ target: 1, targetModel: 1 });
auditLogSchema.index({ createdAt: -1 });
// Immutable — no updates allowed
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog records are immutable');
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
