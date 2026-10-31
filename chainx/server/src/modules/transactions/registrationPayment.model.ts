import mongoose, { type Document, Schema } from 'mongoose';

export enum RegPaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

export enum RegVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RegPaymentMode {
  MANUAL = 'manual',
  AUTOMATED_SANDBOX = 'automated_sandbox',
  AUTOMATED_LIVE = 'automated_live',
}

export interface IRegistrationPayment {
  user: mongoose.Types.ObjectId;
  amount: number; // In paisa (e.g. 1500000 = Rs. 15,000)
  currency: string;
  paymentMethod: 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'manual' | 'crypto';
  paymentMode: RegPaymentMode;
  paymentReference: string;
  paymentStatus: RegPaymentStatus;
  verificationStatus: RegVerificationStatus;
  paymentTimestamp: Date;
  associatedPaymentRecord?: mongoose.Types.ObjectId | undefined;
  proofImage?: string | undefined;
  senderNotes?: string | undefined;
  adminNotes?: string | undefined;
  rejectionReason?: string | undefined;
  reviewedBy?: mongoose.Types.ObjectId | undefined;
  reviewedAt?: Date | undefined;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IRegistrationPaymentDocument = Document & IRegistrationPayment;

const registrationPaymentSchema = new Schema<IRegistrationPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'bank_transfer', 'manual', 'crypto'],
      required: true,
    },
    paymentMode: {
      type: String,
      enum: Object.values(RegPaymentMode),
      default: RegPaymentMode.MANUAL,
    },
    paymentReference: { type: String, required: true, trim: true },
    paymentStatus: {
      type: String,
      enum: Object.values(RegPaymentStatus),
      default: RegPaymentStatus.PENDING,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(RegVerificationStatus),
      default: RegVerificationStatus.PENDING,
    },
    paymentTimestamp: { type: Date, default: Date.now },
    associatedPaymentRecord: { type: Schema.Types.ObjectId, ref: 'Payment' },
    proofImage: { type: String },
    senderNotes: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

registrationPaymentSchema.index({ user: 1, paymentStatus: 1 });
registrationPaymentSchema.index({ verificationStatus: 1, createdAt: -1 });
registrationPaymentSchema.index({ paymentReference: 1 });

export const RegistrationPayment = mongoose.model<IRegistrationPayment>(
  'RegistrationPayment',
  registrationPaymentSchema
);
