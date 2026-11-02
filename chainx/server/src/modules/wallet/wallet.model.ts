import mongoose, { type Document, Schema } from 'mongoose';

export interface IWallet {
  user: mongoose.Types.ObjectId;
  /** Available balance (cleared, withdrawable) in paisa */
  availableBalance: number;
  /** Pending balance (reserved for in-progress withdrawals) in paisa */
  pendingBalance: number;
  /** Total deposited (lifetime) in paisa */
  totalDeposited: number;
  /** Total withdrawn (lifetime) in paisa */
  totalWithdrawn: number;
  /** Total earned from all sources (lifetime) in paisa */
  totalEarned: number;
  /** Task reward earnings (lifetime) in paisa */
  taskEarnings: number;
  /** Referral commission earnings (lifetime) in paisa */
  referralCommissions: number;
  /** Referral bonus / milestone earnings (lifetime) in paisa */
  referralBonuses: number;
  /** Registration fee refund credits (lifetime) in paisa */
  refundCredits: number;
  isLocked: boolean;
  lockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IWalletDocument = Document & IWallet;

const walletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalDeposited: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    taskEarnings: { type: Number, default: 0, min: 0 },
    referralCommissions: { type: Number, default: 0, min: 0 },
    referralBonuses: { type: Number, default: 0, min: 0 },
    refundCredits: { type: Number, default: 0, min: 0 },
    isLocked: { type: Boolean, default: false },
    lockedReason: { type: String },
  },
  { timestamps: true }
);

walletSchema.index({ user: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
