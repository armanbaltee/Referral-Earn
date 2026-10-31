import mongoose, { type Document, Schema } from 'mongoose';

export enum RefundStatus {
  INELIGIBLE = 'ineligible',
  ELIGIBLE = 'eligible',
  REQUESTED = 'requested',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  COMPLETED = 'completed',
}

export enum RefundPayoutMethod {
  WALLET_CREDIT = 'wallet_credit',
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  BANK_TRANSFER = 'bank_transfer',
}

export interface IRegistrationRefund {
  user: mongoose.Types.ObjectId;
  registrationPayment?: mongoose.Types.ObjectId | undefined;
  /** Original registration fee paid in paisa (e.g. 1500000 = Rs. 15,000) */
  feeAmount: number;
  qualifyingReferralsCount: number;
  status: RefundStatus;
  payoutMethod?: RefundPayoutMethod | undefined;
  payoutDetails?: {
    accountTitle?: string | undefined;
    accountNumber?: string | undefined;
    bankName?: string | undefined;
    iban?: string | undefined;
  } | undefined;
  requestedAt?: Date | undefined;
  reviewedBy?: mongoose.Types.ObjectId | undefined;
  reviewedAt?: Date | undefined;
  adminNotes?: string | undefined;
  rejectionReason?: string | undefined;
  transactionReference?: string | undefined;
  walletTransaction?: mongoose.Types.ObjectId | undefined;
  paidAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IRegistrationRefundDocument = Document & IRegistrationRefund;

const registrationRefundSchema = new Schema<IRegistrationRefund>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registrationPayment: { type: Schema.Types.ObjectId, ref: 'RegistrationPayment' },
    feeAmount: { type: Number, required: true, default: 1500000 },
    qualifyingReferralsCount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.INELIGIBLE,
    },
    payoutMethod: {
      type: String,
      enum: Object.values(RefundPayoutMethod),
      default: RefundPayoutMethod.WALLET_CREDIT,
    },
    payoutDetails: {
      accountTitle: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      iban: { type: String },
    },
    requestedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNotes: { type: String },
    rejectionReason: { type: String },
    transactionReference: { type: String },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

registrationRefundSchema.index({ status: 1 });
registrationRefundSchema.index({ createdAt: -1 });

export const RegistrationRefund = mongoose.model<IRegistrationRefund>(
  'RegistrationRefund',
  registrationRefundSchema
);
