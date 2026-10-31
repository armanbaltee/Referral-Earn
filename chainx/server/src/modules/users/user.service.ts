import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors.js';
import { env } from '../../config/env.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { Referral, ReferralStatus } from '../referrals/referral.model.js';
import { Deposit, DepositStatus, PaymentMethod } from '../deposits/deposit.model.js';
import { User, type IUserDocument } from './user.model.js';
import { Session } from './session.model.js';
import {
  AccountStatus,
  RegistrationPaymentStatus,
  type UserRegistrationDTO,
  type UserLoginDTO,
  type AdminUserQueryDTO,
} from './user.types.js';
import { UserRole, type AccessTokenPayload } from '../../types/index.js';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Wrapper to avoid TS overload issues with StringValue vs string in newer @types/jsonwebtoken
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function signJwt(payload: object, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn } as any);
}

async function generateUniqueReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  while (attempts < 10) {
    let code = 'CHX-';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const exists = await User.findOne({ referralCode: code }).select('_id').lean();
    if (!exists) {
      return code;
    }
    attempts++;
  }
  return `CHX-${Date.now().toString(36).toUpperCase()}`;
}

export class UserService {
  // â”€â”€â”€ 1. User Registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async register(
    dto: UserRegistrationDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: IUserDocument;
    verificationToken: string;
    registrationFee: number;
    redirectUrl: string;
  }> {
    // 1. Duplicate check (email & phone)
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    })
      .select('email phone')
      .lean();

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new ConflictError('An account with this email address already exists.');
      }
      throw new ConflictError('An account with this phone number already exists.');
    }

    // 2. Referral code validation (if provided)
    let referrer: IUserDocument | null = null;
    const cleanReferralCode = dto.referralCode?.trim().toUpperCase();

    if (cleanReferralCode) {
      referrer = await User.findOne({ referralCode: cleanReferralCode });
      if (!referrer) {
        throw new BadRequestError('Invalid referral code. Please verify or leave it blank.');
      }

      if (referrer.accountStatus === AccountStatus.SUSPENDED || referrer.accountStatus === AccountStatus.BANNED) {
        throw new BadRequestError('The referring account is currently inactive.');
      }
    }

    // 3. Generate unique referral code for the new user
    const newUserReferralCode = await generateUniqueReferralCode();

    // 4. Create user in PENDING_PAYMENT status
    const user = new User({
      name: dto.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: dto.password,
      role: UserRole.USER,
      referralCode: newUserReferralCode,
      referredBy: referrer ? referrer._id : null,
      accountStatus: AccountStatus.PENDING_PAYMENT,
      registrationFee: 1500000, // Rs. 15,000 in minor units (paisa)
      registrationPaymentStatus: RegistrationPaymentStatus.UNPAID,
      termsAccepted: dto.termsAccepted,
      isActive: false, // Inactive until payment confirmed
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // 5. If referred, record pending referral linkage (NO commission awarded yet!)
    if (referrer) {
      await Referral.create({
        referrer: referrer._id,
        referee: user._id,
        referralCode: referrer.referralCode,
        status: ReferralStatus.PAYMENT_PENDING,
        level: 1, // Direct referral
        totalCommissionEarned: 0,
        isEligibleForMilestone: false,
      });
    }

    // 6. Audit log
    await AuditLog.create({
      actor: user._id,
      action: AuditAction.USER_REGISTER,
      target: user._id,
      targetModel: 'User',
      description: `User ${user.email} registered. Awaiting Rs. 15,000 registration fee.`,
      ipAddress,
      userAgent,
    });

    return {
      user,
      verificationToken,
      registrationFee: 15000,
      redirectUrl: '/payment/registration',
    };
  }

  // â”€â”€â”€ 2. User Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async login(
    dto: UserLoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: IUserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check account status restrictions
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenError(
        `Account is suspended. Reason: ${user.suspensionReason ?? 'Policy violation. Contact support.'}`
      );
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new ForbiddenError('Account has been permanently banned from the platform.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT access & refresh tokens
    const tokenFamily = crypto.randomUUID();
    const accessToken = signJwt(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      } as AccessTokenPayload,
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_EXPIRES_IN
    );

    const refreshToken = signJwt(
      {
        userId: user._id.toString(),
        tokenFamily,
      },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN
    );

    // Store session in DB for revocation & tracking
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await Session.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      family: tokenFamily,
      userAgent,
      ipAddress,
      expiresAt,
      isRevoked: false,
    });

    // Audit log
    await AuditLog.create({
      actor: user._id,
      action: AuditAction.USER_LOGIN,
      target: user._id,
      targetModel: 'User',
      description: `User ${user.email} signed in successfully.`,
      ipAddress,
      userAgent,
    });

    return { user, accessToken, refreshToken };
  }

  // â”€â”€â”€ 3. Refresh Token Rotation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async rotateRefreshToken(
    oldRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!oldRefreshToken) {
      throw new UnauthorizedError('No refresh token provided.');
    }

    let payload: { userId: string; tokenFamily: string };
    try {
      payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        tokenFamily: string;
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const hashedOld = hashToken(oldRefreshToken);
    const session = await Session.findOne({ tokenHash: hashedOld });

    // Detect token theft / reuse
    if (!session || session.isRevoked) {
      // Security breach: Revoke entire token family!
      if (session?.family || payload.tokenFamily) {
        await Session.updateMany(
          { user: payload.userId, family: session?.family ?? payload.tokenFamily },
          { isRevoked: true }
        );
      }
      throw new UnauthorizedError('Session expired or invalidated. Please sign in again.');
    }

    const user = await User.findById(payload.userId);
    if (!user || user.accountStatus === AccountStatus.SUSPENDED || user.accountStatus === AccountStatus.BANNED) {
      throw new ForbiddenError('Account is not authorized to renew sessions.');
    }

    // Invalidate old session
    session.isRevoked = true;
    await session.save();

    // Issue new rotated pair
    const newAccessToken = signJwt(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      } as AccessTokenPayload,
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_EXPIRES_IN
    );

    const newRefreshToken = signJwt(
      {
        userId: user._id.toString(),
        tokenFamily: session.family,
      },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN
    );

    // Save new session in same family
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Session.create({
      user: user._id,
      tokenHash: hashToken(newRefreshToken),
      family: session.family,
      userAgent: userAgent ?? session.userAgent,
      ipAddress: ipAddress ?? session.ipAddress,
      expiresAt,
      isRevoked: false,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // â”€â”€â”€ 4. Logout / Revoke Session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await Session.updateOne({ tokenHash: hashed }, { isRevoked: true });
    }
    if (userId) {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(userId),
        action: AuditAction.USER_LOGOUT,
        description: 'User signed out.',
      });
    }
  }

  public static async getUserSessions(userId: string) {
    return Session.find({ user: userId, isRevoked: false })
      .select('_id userAgent ipAddress createdAt lastUsedAt expiresAt')
      .sort({ lastUsedAt: -1 })
      .lean();
  }

  public static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await Session.updateOne(
      { _id: sessionId, user: userId },
      { isRevoked: true }
    );
    if (result.matchedCount === 0) {
      throw new NotFoundError('Session not found or already revoked.');
    }
  }

  public static async revokeAllSessions(userId: string): Promise<void> {
    await Session.updateMany({ user: userId }, { isRevoked: true });
  }

  // â”€â”€â”€ 5. Password Recovery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Do not disclose whether email exists
      return { message: 'If this email is registered, you will receive password reset instructions.' };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    return {
      message: 'If this email is registered, you will receive password reset instructions.',
      resetToken, // accessible in development / testing
    };
  }

  public static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token.');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all sessions on password reset for security
    await Session.updateMany({ user: user._id }, { isRevoked: true });

    await AuditLog.create({
      actor: user._id,
      action: AuditAction.PASSWORD_CHANGED,
      target: user._id,
      targetModel: 'User',
      description: 'Password reset completed via token.',
    });
  }

  // â”€â”€â”€ 6. Email & Phone Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async verifyEmail(token: string): Promise<IUserDocument> {
    const hashed = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // If registration fee is already paid, activate account
    if (user.registrationPaymentStatus === RegistrationPaymentStatus.PAID) {
      user.accountStatus = AccountStatus.ACTIVE;
      user.isActive = true;
    } else {
      user.accountStatus = AccountStatus.PENDING_PAYMENT;
    }

    await user.save();
    return user;
  }

  // ─── 7. Registration Payment Submission & Confirmation ────────────────────────
  public static async submitRegistrationPayment(
    userId: string,
    paymentMethod: string,
    paymentReference: string,
    proofImage?: string,
    notes?: string
  ): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.registrationPaymentStatus === RegistrationPaymentStatus.PAID) {
      throw new BadRequestError('Registration fee is already recorded as paid.');
    }

    user.registrationPaymentStatus = RegistrationPaymentStatus.PENDING;
    await user.save();

    await Deposit.create({
      user: user._id,
      amount: user.registrationFee,
      paymentMethod: paymentMethod as PaymentMethod,
      status: DepositStatus.PENDING,
      paymentReference,
      proofImage,
      notes: notes ?? 'Registration fee payment submission',
      idempotencyKey: `REG-${user._id.toString()}-${Date.now()}`,
    });

    return user;
  }

  public static async confirmRegistrationPayment(
    userId: string,
    adminId: string,
    transactionId?: string,
    notes?: string
  ): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.registrationPaymentStatus === RegistrationPaymentStatus.PAID) {
      throw new BadRequestError('Registration fee is already recorded as paid.');
    }

    user.registrationPaymentStatus = RegistrationPaymentStatus.PAID;
    user.registrationPaidAt = new Date();

    // Activate user
    user.accountStatus = AccountStatus.ACTIVE;
    user.isActive = true;
    await user.save();

    // Activate the referral record so commissions or downstream tracking can proceed
    const referral = await Referral.findOne({ referee: user._id });
    if (referral) {
      referral.status = ReferralStatus.ACTIVE;
      referral.activatedAt = new Date();
      await referral.save();
    }

    // Log admin action
    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.USER_ACTIVATED,
      target: user._id,
      targetModel: 'User',
      description: `Registration fee (Rs. 15,000) confirmed. Account activated. Ref: ${transactionId ?? 'N/A'}. Notes: ${notes ?? 'None'}`,
    });

    return user;
  }

  // â”€â”€â”€ 8. Admin User Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  public static async getUsersAdmin(query: AdminUserQueryDTO) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      role,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.accountStatus = status;
    }
    if (paymentStatus) {
      filter.registrationPaymentStatus = paymentStatus;
    }
    if (role) {
      filter.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { referralCode: searchRegex },
      ];
    }

    const sortOption: Record<string, 1 | -1> = {
      [sort]: order === 'asc' ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('referredBy', 'name email referralCode')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  public static async getUserDetailsAdmin(userId: string) {
    const user = await User.findById(userId)
      .populate('referredBy', 'name email referralCode')
      .populate('suspendedBy', 'name email')
      .lean();

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const [directReferralsCount, auditHistory, activeSessionsCount] = await Promise.all([
      Referral.countDocuments({ referrer: userId }),
      AuditLog.find({ target: userId }).sort({ createdAt: -1 }).limit(20).lean(),
      Session.countDocuments({ user: userId, isRevoked: false }),
    ]);

    return {
      ...user,
      stats: {
        directReferralsCount,
        activeSessionsCount,
      },
      auditHistory,
    };
  }

  public static async suspendUser(
    adminId: string,
    targetUserId: string,
    reason: string
  ): Promise<IUserDocument> {
    if (adminId === targetUserId) {
      throw new BadRequestError('You cannot suspend your own administrative account.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User not found.');
    }

    if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Administrative accounts cannot be suspended via this endpoint.');
    }

    targetUser.accountStatus = AccountStatus.SUSPENDED;
    targetUser.isActive = false;
    targetUser.suspensionReason = reason;
    targetUser.suspendedAt = new Date();
    targetUser.suspendedBy = new mongoose.Types.ObjectId(adminId);
    await targetUser.save();

    // Revoke all active sessions immediately
    await Session.updateMany({ user: targetUser._id }, { isRevoked: true });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.USER_DEACTIVATED,
      target: targetUser._id,
      targetModel: 'User',
      description: `User suspended. Reason: ${reason}`,
    });

    return targetUser;
  }

  public static async reactivateUser(
    adminId: string,
    targetUserId: string
  ): Promise<IUserDocument> {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User not found.');
    }

    if (targetUser.accountStatus !== AccountStatus.SUSPENDED) {
      throw new BadRequestError('User is not currently suspended.');
    }

    targetUser.accountStatus =
      targetUser.registrationPaymentStatus === RegistrationPaymentStatus.PAID
        ? AccountStatus.ACTIVE
        : AccountStatus.PENDING_PAYMENT;

    targetUser.isActive = targetUser.accountStatus === AccountStatus.ACTIVE;
    targetUser.suspensionReason = undefined;
    targetUser.suspendedAt = undefined;
    targetUser.suspendedBy = undefined;
    await targetUser.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.USER_ACTIVATED,
      target: targetUser._id,
      targetModel: 'User',
      description: 'User account reactivated by admin.',
    });

    return targetUser;
  }
}
