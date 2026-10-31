import mongoose, { type Document, Schema } from 'mongoose';

export enum DepositStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  BANK_TRANSFER = 'bank_transfer',
  MANUAL = 'manual',
}

export interface IDeposit {
  user: mongoose.Types.ObjectId;
  /** Amount in paisa */
  amount: number;
  paymentMethod: PaymentMethod;
  status: DepositStatus;
  paymentReference?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  proofImage?: string;
  notes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  completedAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IDepositDocument = Document & IDeposit;

const depositSchema = new Schema<IDeposit>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(DepositStatus), default: DepositStatus.PENDING },
    paymentReference: { type: String },
    gatewayTransactionId: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
    proofImage: { type: String },
    notes: { type: String, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    completedAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

depositSchema.index({ user: 1, status: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });
depositSchema.index({ gatewayTransactionId: 1 });

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);
