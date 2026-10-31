import mongoose, { type Document, Schema } from 'mongoose';

export interface IIdempotencyRecord {
  key: string;
  operation: string;
  result: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

export type IIdempotencyRecordDocument = Document & IIdempotencyRecord;

const idempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true },
    operation: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Auto-delete expired idempotency records
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>(
  'IdempotencyRecord',
  idempotencyRecordSchema
);
