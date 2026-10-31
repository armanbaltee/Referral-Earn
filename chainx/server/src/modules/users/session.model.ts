import mongoose, { type Document, Schema } from 'mongoose';

export interface ISession {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  family: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ISessionDocument = Document & ISession;

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    family: { type: String, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, isRevoked: 1 });
sessionSchema.index({ tokenHash: 1 });
sessionSchema.index({ family: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-remove expired sessions

export const Session = mongoose.model<ISession>('Session', sessionSchema);
