import mongoose, { type Document, Schema } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
  TASK_REWARD = 'task_reward',
  PRODUCT_PURCHASE = 'product_purchase',
  DAILY_INCOME = 'daily_income',
  REFUND = 'refund',
  REVERSAL = 'reversal',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export interface IWalletTransaction {
  wallet: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  /** Amount in paisa */
  amount: number;
  /** Balance before this transaction in paisa */
  balanceBefore: number;
  /** Balance after this transaction in paisa */
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceModel?: string;
  /** For reversals: reference to the original transaction */
  reversalOf?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IWalletTransactionDocument = Document & IWalletTransaction;

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true, maxlength: 500 },
    referenceId: { type: String },
    referenceModel: { type: String },
    reversalOf: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    metadata: { type: Schema.Types.Mixed },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    // Immutable ledger: prevent edits on completed transactions
    strict: true,
  }
);

walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ referenceId: 1 });
walletTransactionSchema.index({ createdAt: -1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema
);
