import mongoose, { type Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface IOrder {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  status: OrderStatus;
  /** Amount paid in paisa */
  amountPaid: number;
  /** Daily income in paisa at time of purchase */
  dailyIncome: number;
  /** Referral commission in paisa at time of purchase */
  referralCommission: number;
  /** Duration in days */
  durationDays: number;
  activatedAt?: Date;
  expiresAt?: Date;
  lastDailyIncomeAt?: Date;
  totalIncomeEarned: number;
  walletTransaction?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IOrderDocument = Document & IOrder;

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    amountPaid: { type: Number, required: true, min: 0 },
    dailyIncome: { type: Number, required: true, min: 0 },
    referralCommission: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    activatedAt: { type: Date },
    expiresAt: { type: Date },
    lastDailyIncomeAt: { type: Date },
    totalIncomeEarned: { type: Number, default: 0, min: 0 },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1, createdAt: -1 });
orderSchema.index({ product: 1 });
orderSchema.index({ status: 1, expiresAt: 1 });
orderSchema.index({ status: 1, lastDailyIncomeAt: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
