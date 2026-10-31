import mongoose, { type Document, Schema } from 'mongoose';

export enum RefundStatus {
  REQUESTED = 'requested',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface IRefund {
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  deposit?: mongoose.Types.ObjectId;
  status: RefundStatus;
  /** Requested amount in paisa */
  requestedAmount: number;
  /** Approved amount in paisa */
  approvedAmount?: number;
  reason: string;
  adminNotes?: string;
  rejectionReason?: string;
  walletTransaction?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IRefundDocument = Document & IRefund;

const refundSchema = new Schema<IRefund>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    deposit: { type: Schema.Types.ObjectId, ref: 'Deposit' },
    status: { type: String, enum: Object.values(RefundStatus), default: RefundStatus.REQUESTED },
    requestedAmount: { type: Number, required: true, min: 1 },
    approvedAmount: { type: Number, min: 0 },
    reason: { type: String, required: true, maxlength: 1000 },
    adminNotes: { type: String, maxlength: 1000 },
    rejectionReason: { type: String, maxlength: 500 },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

refundSchema.index({ user: 1, status: 1, createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ order: 1 });
refundSchema.index({ deposit: 1 });

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
