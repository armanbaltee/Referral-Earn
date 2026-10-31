import mongoose, { type Document, Schema } from 'mongoose';

export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IReferral {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  level: number;
  /** Total commission earned in paisa */
  totalCommissionEarned: number;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IReferralDocument = Document & IReferral;

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referralCode: { type: String, required: true },
    status: { type: String, enum: Object.values(ReferralStatus), default: ReferralStatus.PENDING },
    level: { type: Number, required: true, min: 1, max: 10, default: 1 },
    totalCommissionEarned: { type: Number, default: 0, min: 0 },
    activatedAt: { type: Date },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: -1 });
// Ensure a user can only be referred once
referralSchema.index({ referee: 1 }, { unique: true });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
