import mongoose, { type Document, Schema } from 'mongoose';

import { PaymentMethod } from '../deposits/deposit.model.js';

export enum WithdrawalStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

export interface IWithdrawal {
  user: mongoose.Types.ObjectId;
  /** Amount in paisa */
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  status: WithdrawalStatus;
  /** When amount was reserved from available balance */
  reservedAt?: Date;
  /** Gateway payout transaction ID */
  gatewayTransactionId?: string;
  rejectionReason?: string;
  adminNotes?: string;
  /** Admin who approved or rejected */
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  /** Admin who processed (completed) the payout */
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  completedAt?: Date;
  /** Wallet debit transaction (created on completion) */
  walletTransaction?: mongoose.Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IWithdrawalDocument = Document & IWithdrawal;

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    accountTitle: { type: String, required: true, trim: true, maxlength: 100 },
    accountNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.PENDING,
    },
    reservedAt: { type: Date },
    gatewayTransactionId: { type: String },
    rejectionReason: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    completedAt: { type: Date },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

withdrawalSchema.index({ user: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ idempotencyKey: 1 }, { unique: true });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
