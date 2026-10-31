import mongoose, { type Document, type Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

import { UserRole } from '../../types/index.js';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  refreshTokenFamily: string[];
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(jwtIat: number): boolean;
}

export type IUserDocument = Document & IUser & IUserMethods;
export type IUserModel = Model<IUser, Record<string, never>, IUserMethods>;

// ─── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    avatar: { type: String },
    referralCode: { type: String, required: true, unique: true, uppercase: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    refreshTokenFamily: { type: [String], default: [], select: false },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        Reflect.deleteProperty(ret, 'password');
        Reflect.deleteProperty(ret, 'refreshTokenFamily');
        Reflect.deleteProperty(ret, '__v');
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ referredBy: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save hook: hash password ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ─── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

userSchema.methods.changedPasswordAfter = function (jwtIat: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtIat < changedTimestamp;
  }
  return false;
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema);
