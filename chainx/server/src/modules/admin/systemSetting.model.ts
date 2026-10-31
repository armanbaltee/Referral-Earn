import mongoose, { type Document, Schema } from 'mongoose';

export interface ISystemSetting {
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  description: string;
  category: 'payment' | 'system' | 'commission' | 'general';
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ISystemSettingDocument = Document & ISystemSetting;

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['payment', 'system', 'commission', 'general'],
      default: 'general',
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

systemSettingSchema.index({ key: 1 });
systemSettingSchema.index({ category: 1 });

export const SystemSetting = mongoose.model<ISystemSetting>(
  'SystemSetting',
  systemSettingSchema
);
