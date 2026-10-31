import mongoose, { type Document, type Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { UserRole } from '../../types/index.js';
import { AccountStatus, RegistrationPaymentStatus } from './user.types.js';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string | undefined;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId | undefined;
  accountStatus: AccountStatus;
  registrationFee: number; // in paisa (1500000 = Rs. 15,000)
  registrationPaymentStatus: RegistrationPaymentStatus;
  registrationPaidAt?: Date | undefined;
  termsAccepted: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerificationToken?: string | undefined;
  emailVerificationExpires?: Date | undefined;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  phoneVerificationCode?: string | undefined;
  phoneVerificationExpires?: Date | undefined;
  suspensionReason?: string | undefined;
  suspendedAt?: Date | undefined;
  suspendedBy?: mongoose.Types.ObjectId | undefined;
  passwordChangedAt?: Date | undefined;
  lastLoginAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(jwtIat: number): boolean;
  createEmailVerificationToken(): string;
  createPasswordResetToken(): string;
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
    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING_PAYMENT,
    },
    registrationFee: {
      type: Number,
      required: true,
      default: 1500000, // Rs. 15,000 in minor paisa (1 PKR = 100 paisa)
    },
    registrationPaymentStatus: {
      type: String,
      enum: Object.values(RegistrationPaymentStatus),
      default: RegistrationPaymentStatus.UNPAID,
    },
    registrationPaidAt: { type: Date },
    termsAccepted: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, default: false }, // only activated after payment & verification
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    phoneVerificationCode: { type: String, select: false },
    phoneVerificationExpires: { type: Date, select: false },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        Reflect.deleteProperty(ret, 'password');
        Reflect.deleteProperty(ret, 'emailVerificationToken');
        Reflect.deleteProperty(ret, 'emailVerificationExpires');
        Reflect.deleteProperty(ret, 'passwordResetToken');
        Reflect.deleteProperty(ret, 'passwordResetExpires');
        Reflect.deleteProperty(ret, 'phoneVerificationCode');
        Reflect.deleteProperty(ret, 'phoneVerificationExpires');
        Reflect.deleteProperty(ret, '__v');
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ referralCode: 1 }, { unique: true });
userSchema.index({ referredBy: 1 });
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ registrationPaymentStatus: 1 });
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

userSchema.methods.createEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.createPasswordResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema);
