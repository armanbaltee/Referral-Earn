import mongoose, { type Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderFulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string | undefined;
}

export interface IOrder {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  productSnapshot: {
    name: string;
    price: number;
    image?: string | undefined;
    category?: string | undefined;
  };
  quantity: number;
  totalAmount: number; // in paisa
  amountPaid: number; // in paisa
  paymentMethod: 'wallet' | 'easypaisa' | 'jazzcash' | 'manual';
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  status: OrderStatus;
  shippingAddress?: IShippingAddress | undefined;
  paymentReference?: string | undefined;
  trackingNumber?: string | undefined;
  notes?: string | undefined;

  /** Daily income in paisa at time of purchase (for package/tier items) */
  dailyIncome: number;
  /** Referral commission in paisa at time of purchase */
  referralCommission: number;
  /** Duration in days */
  durationDays: number;
  activatedAt?: Date | undefined;
  expiresAt?: Date | undefined;
  lastDailyIncomeAt?: Date | undefined;
  totalIncomeEarned: number;
  walletTransaction?: mongoose.Types.ObjectId | undefined;

  createdAt: Date;
  updatedAt: Date;
}

export type IOrderDocument = Document & IOrder;

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String },
      category: { type: String },
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'easypaisa', 'jazzcash', 'manual'],
      default: 'wallet',
    },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.PENDING,
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(OrderFulfillmentStatus),
      default: OrderFulfillmentStatus.UNFULFILLED,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
    },
    paymentReference: { type: String },
    trackingNumber: { type: String },
    notes: { type: String, maxlength: 500 },

    dailyIncome: { type: Number, required: true, min: 0, default: 0 },
    referralCommission: { type: Number, required: true, min: 0, default: 0 },
    durationDays: { type: Number, required: true, min: 1, default: 365 },
    activatedAt: { type: Date },
    expiresAt: { type: Date },
    lastDailyIncomeAt: { type: Date },
    totalIncomeEarned: { type: Number, default: 0, min: 0 },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
