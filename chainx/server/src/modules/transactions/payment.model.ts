import mongoose, { type Document, Schema } from 'mongoose';

export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  MANUAL = 'manual',
}

export enum PaymentMode {
  SANDBOX = 'sandbox',
  LIVE = 'live',
  MANUAL = 'manual',
}

export interface IPayment {
  user: mongoose.Types.ObjectId;
  deposit?: mongoose.Types.ObjectId;
  withdrawal?: mongoose.Types.ObjectId;
  gateway: PaymentGateway;
  mode: PaymentMode;
  status: PaymentStatus;
  /** Amount in paisa */
  amount: number;
  currency: string;
  merchantOrderId: string;
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  gatewayResponse?: Record<string, unknown>;
  callbackPayload?: Record<string, unknown>;
  failureReason?: string;
  completedAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IPaymentDocument = Document & IPayment;

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deposit: { type: Schema.Types.ObjectId, ref: 'Deposit' },
    withdrawal: { type: Schema.Types.ObjectId, ref: 'Withdrawal' },
    gateway: { type: String, enum: Object.values(PaymentGateway), required: true },
    mode: { type: String, enum: Object.values(PaymentMode), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.INITIATED },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    merchantOrderId: { type: String, required: true, unique: true },
    gatewayTransactionId: { type: String },
    gatewayOrderId: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
    callbackPayload: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    completedAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
