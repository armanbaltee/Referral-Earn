import mongoose, { type Document, Schema } from 'mongoose';

export interface IWallet {
  user: mongoose.Types.ObjectId;
  /** Available balance in paisa */
  balance: number;
  /** Total deposited (lifetime) in paisa */
  totalDeposited: number;
  /** Total withdrawn (lifetime) in paisa */
  totalWithdrawn: number;
  /** Total commission earned (lifetime) in paisa */
  totalCommissionEarned: number;
  /** Total task earnings (lifetime) in paisa */
  totalTaskEarned: number;
  isLocked: boolean;
  lockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IWalletDocument = Document & IWallet;

const walletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    totalDeposited: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    totalCommissionEarned: { type: Number, default: 0, min: 0 },
    totalTaskEarned: { type: Number, default: 0, min: 0 },
    isLocked: { type: Boolean, default: false },
    lockedReason: { type: String },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
