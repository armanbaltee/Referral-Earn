import mongoose, { type Document, Schema } from 'mongoose';

export enum DepositStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
}

export interface IDeposit {
  user: mongoose.Types.ObjectId;
  /** Amount in paisa */
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: DepositStatus;
  /** User-submitted transaction reference */
  paymentReference?: string;
  /** Gateway-assigned transaction ID (automated) */
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  /** Uploaded proof image URL */
  proofImageUrl?: string;
  senderNotes?: string;
  /** Admin review */
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  completedAt?: Date;
  /** Wallet transaction created on approval */
  walletTransaction?: mongoose.Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IDepositDocument = Document & IDeposit;

const depositSchema = new Schema<IDeposit>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(DepositStatus), default: DepositStatus.PENDING },
    paymentReference: { type: String, trim: true },
    gatewayTransactionId: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
    proofImageUrl: { type: String },
    senderNotes: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    completedAt: { type: Date },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

depositSchema.index({ user: 1, status: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });
depositSchema.index({ idempotencyKey: 1 }, { unique: true });
depositSchema.index({ gatewayTransactionId: 1 });

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);
