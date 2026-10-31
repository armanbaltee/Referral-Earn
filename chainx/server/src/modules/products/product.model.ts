import mongoose, { type Document, Schema } from 'mongoose';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  images: string[];
  /** Price in paisa */
  price: number;
  compareAtPrice?: number | undefined;
  sku?: string | undefined;
  /** Daily income in paisa */
  dailyIncome: number;
  /** Referral commission in paisa */
  referralCommission: number;
  level: number;
  stock: number;
  trackInventory: boolean;
  status: ProductStatus;
  isArchived: boolean;
  category: string;
  tags: string[];
  totalPurchases: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IProductDocument = Document & IProduct;

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 2000 },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    sku: { type: String, trim: true },
    dailyIncome: { type: Number, required: true, min: 0, default: 0 },
    referralCommission: { type: Number, required: true, min: 0, default: 0 },
    level: { type: Number, required: true, min: 1, max: 10, default: 1 },
    stock: { type: Number, required: true, min: 0, default: 100 },
    trackInventory: { type: Boolean, default: true },
    status: { type: String, enum: Object.values(ProductStatus), default: ProductStatus.ACTIVE },
    isArchived: { type: Boolean, default: false, index: true },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    totalPurchases: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, isArchived: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
