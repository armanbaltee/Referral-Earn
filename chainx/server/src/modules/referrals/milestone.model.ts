import mongoose, { type Document, Schema } from 'mongoose';

export enum MilestoneStatus {
  ACHIEVED = 'achieved',
  CREDITED = 'credited',
  REVERSED = 'reversed',
}

export interface IMilestoneAchievement {
  user: mongoose.Types.ObjectId;
  milestoneType: string; // e.g. 'direct_referrals_10'
  threshold: number; // e.g. 10
  bonusAmount: number; // in paisa (e.g. 1500000 = Rs. 15,000)
  qualifyingReferrals: mongoose.Types.ObjectId[];
  status: MilestoneStatus;
  idempotencyKey: string;
  commissionRecord?: mongoose.Types.ObjectId | undefined;
  walletTransaction?: mongoose.Types.ObjectId | undefined;
  achievedAt: Date;
  creditedAt?: Date | undefined;
  reversalReason?: string | undefined;
  reversedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IMilestoneAchievementDocument = Document & IMilestoneAchievement;

const milestoneAchievementSchema = new Schema<IMilestoneAchievement>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    milestoneType: { type: String, required: true, default: 'direct_referrals_10' },
    threshold: { type: Number, required: true, default: 10 },
    bonusAmount: { type: Number, required: true, default: 1500000 },
    qualifyingReferrals: [{ type: Schema.Types.ObjectId, ref: 'Referral' }],
    status: {
      type: String,
      enum: Object.values(MilestoneStatus),
      default: MilestoneStatus.ACHIEVED,
    },
    idempotencyKey: { type: String, required: true, unique: true },
    commissionRecord: { type: Schema.Types.ObjectId, ref: 'Commission' },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    achievedAt: { type: Date, default: Date.now },
    creditedAt: { type: Date },
    reversalReason: { type: String },
    reversedAt: { type: Date },
  },
  { timestamps: true }
);

milestoneAchievementSchema.index({ user: 1, milestoneType: 1 }, { unique: true });
milestoneAchievementSchema.index({ createdAt: -1 });

export const MilestoneAchievement = mongoose.model<IMilestoneAchievement>(
  'MilestoneAchievement',
  milestoneAchievementSchema
);
