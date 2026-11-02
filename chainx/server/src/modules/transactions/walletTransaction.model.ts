import mongoose, { type Document, Schema } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TASK_REWARD = 'TASK_REWARD',
  REFERRAL_COMMISSION = 'REFERRAL_COMMISSION',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  REGISTRATION_REFUND = 'REGISTRATION_REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL',
}

export enum TransactionDirection {
  CREDIT = 'credit',
  DEBIT = 'debit',
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
  direction: TransactionDirection;
  status: TransactionStatus;
  /** Amount in paisa (always positive) */
  amount: number;
  currency: string;
  /** Available balance before this transaction in paisa */
  balanceBefore: number;
  /** Available balance after this transaction in paisa */
  balanceAfter: number;
  /** Source document ID (Deposit, Withdrawal, etc.) */
  sourceReference?: string;
  sourceModel?: string;
  /** Human-readable description */
  description: string;
  /** Idempotency key to prevent duplicate crediting */
  idempotencyKey: string;
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
    direction: { type: String, enum: Object.values(TransactionDirection), required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    sourceReference: { type: String },
    sourceModel: { type: String },
    description: { type: String, required: true, maxlength: 500 },
    idempotencyKey: { type: String, required: true, unique: true },
    reversalOf: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    metadata: { type: Schema.Types.Mixed },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    // Immutable ledger
    strict: true,
  }
);

walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true });
walletTransactionSchema.index({ sourceReference: 1 });
walletTransactionSchema.index({ createdAt: -1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema
);
