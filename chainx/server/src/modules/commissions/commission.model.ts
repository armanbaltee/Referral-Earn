import mongoose, { type Document, Schema } from 'mongoose';

export enum CommissionType {
  REFERRAL = 'referral',
  PRODUCT_SALE = 'product_sale',
  DAILY_INCOME = 'daily_income',
  TASK_BONUS = 'task_bonus',
}

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface ICommission {
  user: mongoose.Types.ObjectId;
  type: CommissionType;
  status: CommissionStatus;
  /** Commission amount in paisa */
  amount: number;
  source?: mongoose.Types.ObjectId;
  sourceModel?: string;
  referral?: mongoose.Types.ObjectId;
  level: number;
  description: string;
  idempotencyKey: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ICommissionDocument = Document & ICommission;

const commissionSchema = new Schema<ICommission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(CommissionType), required: true },
    status: {
      type: String,
      enum: Object.values(CommissionStatus),
      default: CommissionStatus.PENDING,
    },
    amount: { type: Number, required: true, min: 0 },
    source: { type: Schema.Types.ObjectId },
    sourceModel: { type: String },
    referral: { type: Schema.Types.ObjectId, ref: 'Referral' },
    level: { type: Number, required: true, min: 1, default: 1 },
    description: { type: String, required: true, maxlength: 500 },
    idempotencyKey: { type: String, required: true, unique: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

commissionSchema.index({ user: 1, type: 1, status: 1, createdAt: -1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ referral: 1 });

export const Commission = mongoose.model<ICommission>('Commission', commissionSchema);
