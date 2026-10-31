import mongoose, { type Document, Schema } from 'mongoose';

export enum ReferralStatus {
  REGISTERED = 'registered',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  VERIFICATION_PENDING = 'verification_pending',
  ELIGIBLE = 'eligible',
  COMMISSION_PROCESSING = 'commission_processing',
  COMMISSION_CREDITED = 'commission_credited',
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
  REVERSED = 'reversed',
}

export interface IReferral {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  level: number;
  /** Total commission earned in paisa */
  totalCommissionEarned: number;
  /** Direct commission amount for this referral in paisa */
  commissionAmount: number;
  commissionPaidAt?: Date | undefined;
  /** Whether this referral counts toward the 10-referral milestone and refund eligibility */
  isEligibleForMilestone: boolean;
  milestoneCounted: boolean;
  activatedAt?: Date | undefined;
  /** Reversal fields */
  reversalReason?: string | undefined;
  reversedAt?: Date | undefined;
  reversedBy?: mongoose.Types.ObjectId | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IReferralDocument = Document & IReferral;

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referralCode: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      default: ReferralStatus.REGISTERED,
    },
    level: { type: Number, required: true, min: 1, max: 10, default: 1 },
    totalCommissionEarned: { type: Number, default: 0, min: 0 },
    commissionAmount: { type: Number, default: 0, min: 0 },
    commissionPaidAt: { type: Date },
    isEligibleForMilestone: { type: Boolean, default: false },
    milestoneCounted: { type: Boolean, default: false },
    activatedAt: { type: Date },
    reversalReason: { type: String },
    reversedAt: { type: Date },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referrer: 1, isEligibleForMilestone: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: -1 });
// Ensure a user can only be referred once
referralSchema.index({ referee: 1 }, { unique: true });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
