import mongoose, { type Document, Schema } from 'mongoose';

import type { PaymentMethod } from '../deposits/deposit.model.js';
import { PaymentMethod as PM } from '../deposits/deposit.model.js';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface IWithdrawal {
  user: mongoose.Types.ObjectId;
  /** Amount in paisa */
  amount: number;
  paymentMethod: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  status: WithdrawalStatus;
  gatewayTransactionId?: string;
  rejectionReason?: string;
  notes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  completedAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IWithdrawalDocument = Document & IWithdrawal;

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: Object.values(PM), required: true },
    accountTitle: { type: String, required: true, trim: true, maxlength: 100 },
    accountNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.PENDING,
    },
    gatewayTransactionId: { type: String },
    rejectionReason: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 500 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    completedAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

withdrawalSchema.index({ user: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
