import mongoose from 'mongoose';
import {
  Referral,
  ReferralStatus,
  type IReferralDocument,
} from './referral.model.js';
import {
  MilestoneAchievement,
  MilestoneStatus,
  type IMilestoneAchievementDocument,
} from './milestone.model.js';
import {
  RegistrationRefund,
  RefundStatus,
  RefundPayoutMethod,
  type IRegistrationRefundDocument,
} from './registrationRefund.model.js';
import { User } from '../users/user.model.js';
import { AccountStatus, RegistrationPaymentStatus } from '../users/user.types.js';
import { Wallet } from '../wallet/wallet.model.js';
import {
  WalletTransaction,
  TransactionType,
  TransactionDirection,
  TransactionStatus,
} from '../transactions/walletTransaction.model.js';
import { Commission, CommissionType, CommissionStatus } from '../commissions/commission.model.js';
import { RegistrationPayment, RegPaymentStatus } from '../transactions/registrationPayment.model.js';
import { SystemSettingService } from '../admin/systemSetting.service.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { NotificationService } from '../notifications/notification.service.js';
import { NotificationType } from '../notifications/notification.model.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors.js';

export interface ReferralDashboardData {
  referralCode: string;
  referralUrl: string;
  statistics: {
    totalReferred: number;
    pendingCount: number;
    eligibleCount: number;
    totalCommissionPaisa: number;
    totalCommissionPKR: number;
    milestoneBonusPaisa: number;
    milestoneBonusPKR: number;
    totalEarningsPaisa: number;
    totalEarningsPKR: number;
  };
  milestone: {
    threshold: number;
    currentEligibleCount: number;
    remaining: number;
    progressPercentage: number;
    bonusAmountPaisa: number;
    bonusAmountPKR: number;
    isAchieved: boolean;
    achievementRecord?: IMilestoneAchievementDocument | null;
  };
  feeRefund: {
    userRegistrationPaid: boolean;
    feeAmountPaisa: number;
    feeAmountPKR: number;
    qualifyingCount: number;
    threshold: number;
    isEligible: boolean;
    refundRecord?: IRegistrationRefundDocument | null;
  };
  directReferrals: Array<{
    _id: string;
    referee: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      accountStatus: string;
      registrationPaymentStatus: string;
      createdAt: string;
    };
    status: ReferralStatus;
    level: number;
    commissionAmount: number;
    commissionPaidAt?: string | null;
    isEligibleForMilestone: boolean;
    createdAt: string;
  }>;
  recentActivity: Array<{
    _id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

export class ReferralService {
  // ─── Generate Unique Referral Code ──────────────────────────────────────────
  public static async generateUniqueReferralCode(name: string): Promise<string> {
    const cleanPrefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    const prefix = cleanPrefix.length >= 3 ? cleanPrefix : 'CHAINX';

    for (let i = 0; i < 20; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `${prefix}${randomSuffix}`;
      const exists = await User.exists({ referralCode: code });
      if (!exists) {
        return code;
      }
    }
    // Fallback timestamp code
    return `CX${Date.now().toString().slice(-6)}`;
  }

  // ─── Get User Referral Dashboard ────────────────────────────────────────────
  public static async getUserReferralDashboard(userId: string): Promise<ReferralDashboardData> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const clientUrl = process.env['CLIENT_URL'] || 'http://localhost:5173';
    const referralUrl = `${clientUrl}/register?ref=${user.referralCode}`;

    const policy = await SystemSettingService.getReferralCommissionPolicy();

    // Query all direct referrals
    const referrals = await Referral.find({ referrer: user._id, level: 1 })
      .populate('referee', 'name email phone accountStatus registrationPaymentStatus createdAt')
      .sort({ createdAt: -1 });

    // Calculate statistics
    let pendingCount = 0;
    let eligibleCount = 0;
    let totalCommissionPaisa = 0;

    for (const ref of referrals) {
      if (ref.isEligibleForMilestone) {
        eligibleCount++;
      } else if (
        ref.status === ReferralStatus.REGISTERED ||
        ref.status === ReferralStatus.PAYMENT_PENDING ||
        ref.status === ReferralStatus.VERIFICATION_PENDING ||
        ref.status === ReferralStatus.PENDING
      ) {
        pendingCount++;
      }
      totalCommissionPaisa += ref.commissionAmount || ref.totalCommissionEarned || 0;
    }

    // Milestone calculation
    const milestoneAchievement = await MilestoneAchievement.findOne({
      user: user._id,
      milestoneType: 'direct_referrals_10',
    });

    const isMilestoneAchieved = !!milestoneAchievement;
    const milestoneBonusPaisa = isMilestoneAchieved ? milestoneAchievement.bonusAmount : 0;
    const remainingToMilestone = Math.max(0, policy.milestoneThreshold - eligibleCount);
    const progressPercentage = Math.min(
      100,
      Math.round((eligibleCount / policy.milestoneThreshold) * 100)
    );

    // Registration fee refund calculation
    const userRegistrationPaid = user.registrationPaymentStatus === RegistrationPaymentStatus.PAID;
    const isRefundEligible = userRegistrationPaid && eligibleCount >= policy.refundEligibilityThreshold;
    const refundRecord = await RegistrationRefund.findOne({ user: user._id });

    // Activity history (Commissions and Bonuses)
    const commissions = await Commission.find({
      user: user._id,
      type: { $in: [CommissionType.REFERRAL, CommissionType.MILESTONE_BONUS] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formattedReferrals = referrals.map((r) => {
      const refUser = r.referee as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
        phone: string;
        accountStatus: string;
        registrationPaymentStatus: string;
        createdAt: Date;
      };
      return {
        _id: r._id.toString(),
        referee: {
          _id: refUser?._id ? refUser._id.toString() : '',
          name: refUser?.name || 'Direct Lead',
          email: refUser?.email || '',
          phone: refUser?.phone || '',
          accountStatus: refUser?.accountStatus || 'pending',
          registrationPaymentStatus: refUser?.registrationPaymentStatus || 'pending',
          createdAt: refUser?.createdAt ? refUser.createdAt.toISOString() : r.createdAt.toISOString(),
        },
        status: r.status,
        level: r.level,
        commissionAmount: r.commissionAmount || r.totalCommissionEarned || 0,
        commissionPaidAt: r.commissionPaidAt ? r.commissionPaidAt.toISOString() : null,
        isEligibleForMilestone: r.isEligibleForMilestone,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return {
      referralCode: user.referralCode,
      referralUrl,
      statistics: {
        totalReferred: referrals.length,
        pendingCount,
        eligibleCount,
        totalCommissionPaisa,
        totalCommissionPKR: totalCommissionPaisa / 100,
        milestoneBonusPaisa,
        milestoneBonusPKR: milestoneBonusPaisa / 100,
        totalEarningsPaisa: totalCommissionPaisa + milestoneBonusPaisa,
        totalEarningsPKR: (totalCommissionPaisa + milestoneBonusPaisa) / 100,
      },
      milestone: {
        threshold: policy.milestoneThreshold,
        currentEligibleCount: eligibleCount,
        remaining: remainingToMilestone,
        progressPercentage,
        bonusAmountPaisa: policy.milestoneBonus,
        bonusAmountPKR: policy.milestoneBonus / 100,
        isAchieved: isMilestoneAchieved,
        achievementRecord: milestoneAchievement,
      },
      feeRefund: {
        userRegistrationPaid,
        feeAmountPaisa: policy.registrationFee,
        feeAmountPKR: policy.registrationFee / 100,
        qualifyingCount: eligibleCount,
        threshold: policy.refundEligibilityThreshold,
        isEligible: isRefundEligible,
        refundRecord,
      },
      directReferrals: formattedReferrals,
      recentActivity: commissions.map((c) => ({
        _id: c._id.toString(),
        type: c.type,
        amount: c.amount,
        description: c.description,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  // ─── Evaluate & Advance Referral Lifecycle ──────────────────────────────────
  /**
   * Advances the referral lifecycle through all 7 stages:
   * 1. registered -> 2. payment_pending -> 3. payment_confirmed
   * -> 4. verification_pending -> 5. eligible -> 6. commission_processing
   * -> 7. commission_credited.
   * Also unlocks milestone bonuses (Rs. 15,000 at 10 eligible) and marks fee refund eligibility.
   */
  public static async evaluateAndAdvanceReferralLifecycle(refereeUserId: string): Promise<void> {
    const referral = await Referral.findOne({ referee: refereeUserId });
    if (!referral) return;

    const referee = await User.findById(refereeUserId);
    const referrer = await User.findById(referral.referrer);
    if (!referee || !referrer) return;

    // Fraud prevention: Anti-Self-Referral & Suspended checks
    if (referrer._id.toString() === referee._id.toString()) {
      referral.status = ReferralStatus.REJECTED;
      referral.reversalReason = 'Anti-fraud: Self-referral detected.';
      referral.isEligibleForMilestone = false;
      await referral.save();
      return;
    }

    if (referee.accountStatus === AccountStatus.SUSPENDED || referee.accountStatus === AccountStatus.BANNED) {
      referral.status = ReferralStatus.REJECTED;
      referral.reversalReason = 'Referred user account suspended or fraudulent.';
      referral.isEligibleForMilestone = false;
      await referral.save();
      return;
    }

    const policy = await SystemSettingService.getReferralCommissionPolicy();

    // 1. Payment status check
    const isPaymentPaid = referee.registrationPaymentStatus === RegistrationPaymentStatus.PAID;
    if (!isPaymentPaid) {
      referral.status = ReferralStatus.PAYMENT_PENDING;
      referral.isEligibleForMilestone = false;
      await referral.save();
      return;
    }

    // 2. Account verification check
    const isAccountActive = referee.accountStatus === AccountStatus.ACTIVE && referee.isActive;
    if (!isAccountActive) {
      referral.status = ReferralStatus.VERIFICATION_PENDING;
      referral.isEligibleForMilestone = false;
      await referral.save();
      return;
    }

    // 3. User is now an ELIGIBLE referral
    referral.status = ReferralStatus.ELIGIBLE;
    referral.isEligibleForMilestone = true;
    referral.activatedAt = referral.activatedAt || new Date();

    // 4. Commission Processing & Crediting
    // Process direct referral commission (Rs. 1,500) if not yet credited
    const idempotencyKey = `COMM-DIR-REF-${referral._id.toString()}`;
    const existingCommission = await Commission.findOne({ idempotencyKey });

    if (!existingCommission) {
      referral.status = ReferralStatus.COMMISSION_PROCESSING;
      await referral.save();

      const commissionAmount = policy.commissionPerReferral; // 150000 paisa (Rs. 1,500)

      // Find or create referrer wallet
      let referrerWallet = await Wallet.findOne({ user: referrer._id });
      if (!referrerWallet) {
        referrerWallet = await Wallet.create({ user: referrer._id });
      }

      const balanceBefore = referrerWallet.availableBalance;
      const balanceAfter = balanceBefore + commissionAmount;

      referrerWallet.availableBalance = balanceAfter;
      referrerWallet.referralCommissions += commissionAmount;
      referrerWallet.totalEarned += commissionAmount;
      await referrerWallet.save();

      // Create immutable financial ledger transaction
      const walletTx = await WalletTransaction.create({
        wallet: referrerWallet._id,
        user: referrer._id,
        type: TransactionType.REFERRAL_COMMISSION,
        direction: TransactionDirection.CREDIT,
        status: TransactionStatus.COMPLETED,
        amount: commissionAmount,
        currency: 'PKR',
        balanceBefore,
        balanceAfter,
        description: `Direct referral commission (Phase 5) for referee: ${referee.name || referee.email}`,
        idempotencyKey,
        sourceReference: referral._id.toString(),
        sourceModel: 'Referral',
        metadata: {
          level: 1,
          policyVersion: policy.policyVersion,
          refereeId: referee._id.toString(),
          refereeName: referee.name,
        },
      });

      // Create Commission record
      await Commission.create({
        user: referrer._id,
        type: CommissionType.REFERRAL,
        status: CommissionStatus.PAID,
        amount: commissionAmount,
        referral: referral._id,
        level: 1,
        description: `Direct referral commission of Rs. ${commissionAmount / 100} for referee: ${referee.name || referee.email}`,
        idempotencyKey,
        paidAt: new Date(),
        source: walletTx._id,
        sourceModel: 'WalletTransaction',
      });

      referral.status = ReferralStatus.COMMISSION_CREDITED;
      referral.commissionAmount = commissionAmount;
      referral.totalCommissionEarned = commissionAmount;
      referral.commissionPaidAt = new Date();
      await referral.save();

      NotificationService.createNotification({
        userId: referrer._id.toString(),
        type: NotificationType.REFERRAL_COMMISSION_APPROVED,
        title: 'Referral Commission Earned',
        message: `You earned Rs. ${commissionAmount / 100} commission for eligible direct referral: ${referee.name || referee.email}!`,
        referenceId: referral._id.toString(),
        referenceModel: 'Referral',
        link: '/referrals',
        sendEmail: true,
      }).catch(() => {});

      await AuditLog.create({
        actor: referee._id,
        action: AuditAction.USER_ACTIVATED,
        target: referral._id,
        targetModel: 'Referral',
        description: `Commission of Rs. ${commissionAmount / 100} credited to referrer ${referrer.email} for eligible lead ${referee.email}.`,
      });
    } else {
      referral.status = ReferralStatus.COMMISSION_CREDITED;
      await referral.save();
    }

    // 5. Evaluate 10-Referral Milestone Achievement
    await this.evaluateMilestoneAchievement(referrer._id.toString(), policy);

    // 6. Evaluate Registration Fee Refund Eligibility
    await this.evaluateRefundEligibility(referrer._id.toString(), policy);
  }

  // ─── Milestone Achievement Logic (10 Referrals -> Rs. 15,000) ───────────────
  public static async evaluateMilestoneAchievement(
    referrerUserId: string,
    policy: { milestoneThreshold: number; milestoneBonus: number; policyVersion: number }
  ): Promise<IMilestoneAchievementDocument | null> {
    const milestoneType = 'direct_referrals_10';
    const idempotencyKey = `MILESTONE-10-${referrerUserId}`;

    // Prevent duplicate bonus: Check if already awarded
    const existingMilestone = await MilestoneAchievement.findOne({
      user: referrerUserId,
      milestoneType,
    });

    if (existingMilestone) {
      return existingMilestone;
    }

    // Count qualifying eligible direct referrals
    const eligibleReferrals = await Referral.find({
      referrer: referrerUserId,
      level: 1,
      isEligibleForMilestone: true,
      status: ReferralStatus.COMMISSION_CREDITED,
    })
      .sort({ createdAt: 1 })
      .limit(policy.milestoneThreshold);

    if (eligibleReferrals.length < policy.milestoneThreshold) {
      return null;
    }

    const qualifyingIds = eligibleReferrals.map((r) => r._id);
    const bonusAmount = policy.milestoneBonus; // 1500000 paisa (Rs. 15,000)

    // Find or create referrer wallet
    let wallet = await Wallet.findOne({ user: referrerUserId });
    if (!wallet) {
      wallet = await Wallet.create({ user: referrerUserId });
    }

    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore + bonusAmount;

    wallet.availableBalance = balanceAfter;
    wallet.referralBonuses += bonusAmount;
    wallet.totalEarned += bonusAmount;
    await wallet.save();

    // Create immutable ledger transaction
    const walletTx = await WalletTransaction.create({
      wallet: wallet._id,
      user: new mongoose.Types.ObjectId(referrerUserId),
      type: TransactionType.REFERRAL_BONUS,
      direction: TransactionDirection.CREDIT,
      status: TransactionStatus.COMPLETED,
      amount: bonusAmount,
      currency: 'PKR',
      balanceBefore,
      balanceAfter,
      description: `Milestone Bonus: 10 Eligible Direct Referrals Achieved (Rs. ${bonusAmount / 100})`,
      idempotencyKey,
      metadata: {
        isMilestoneBonus: true,
        threshold: policy.milestoneThreshold,
        bonusPaisa: bonusAmount,
        qualifyingReferralCount: qualifyingIds.length,
      },
    });

    // Create Commission record
    const commission = await Commission.create({
      user: new mongoose.Types.ObjectId(referrerUserId),
      type: CommissionType.MILESTONE_BONUS,
      status: CommissionStatus.PAID,
      amount: bonusAmount,
      level: 1,
      description: `Milestone bonus of Rs. ${bonusAmount / 100} for achieving 10 qualifying direct referrals`,
      idempotencyKey,
      paidAt: new Date(),
      source: walletTx._id,
      sourceModel: 'WalletTransaction',
    });

    // Create Milestone Achievement Record
    const milestoneRecord = await MilestoneAchievement.create({
      user: new mongoose.Types.ObjectId(referrerUserId),
      milestoneType,
      threshold: policy.milestoneThreshold,
      bonusAmount,
      qualifyingReferrals: qualifyingIds,
      status: MilestoneStatus.CREDITED,
      idempotencyKey,
      commissionRecord: commission._id,
      walletTransaction: walletTx._id,
      achievedAt: new Date(),
      creditedAt: new Date(),
    });

    // Mark qualifying referrals as milestoneCounted
    await Referral.updateMany(
      { _id: { $in: qualifyingIds } },
      { $set: { milestoneCounted: true } }
    );

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(referrerUserId),
      action: AuditAction.MILESTONE_ACHIEVED,
      target: milestoneRecord._id,
      targetModel: 'MilestoneAchievement',
      description: `User ${referrerUserId} achieved milestone of 10 direct referrals. Bonus of Rs. ${bonusAmount / 100} credited to wallet.`,
    });

    NotificationService.createNotification({
      userId: referrerUserId,
      type: NotificationType.MILESTONE_ACHIEVED,
      title: 'Milestone Bonus Achieved!',
      message: `Congratulations! You achieved 10 verified direct referrals. An extra Rs. ${bonusAmount / 100} milestone bonus has been credited to your wallet!`,
      referenceId: milestoneRecord._id.toString(),
      referenceModel: 'MilestoneAchievement',
      link: '/wallet',
      sendEmail: true,
    }).catch(() => {});

    return milestoneRecord;
  }

  // ─── Registration Fee Refund Eligibility Evaluation ─────────────────────────
  public static async evaluateRefundEligibility(
    referrerUserId: string,
    policy: { refundEligibilityThreshold: number; registrationFee: number }
  ): Promise<void> {
    const user = await User.findById(referrerUserId);
    if (!user || user.registrationPaymentStatus !== RegistrationPaymentStatus.PAID) {
      return;
    }

    const eligibleCount = await Referral.countDocuments({
      referrer: referrerUserId,
      level: 1,
      isEligibleForMilestone: true,
      status: ReferralStatus.COMMISSION_CREDITED,
    });

    if (eligibleCount >= policy.refundEligibilityThreshold) {
      // User is eligible to claim a refund of their Rs. 15,000 fee
      const existingRefund = await RegistrationRefund.findOne({ user: user._id });
      if (!existingRefund) {
        // Find user's original registration payment
        const regPayment = await RegistrationPayment.findOne({
          user: user._id,
          paymentStatus: RegPaymentStatus.SUCCESS,
        });

        await RegistrationRefund.create({
          user: user._id,
          registrationPayment: regPayment?._id,
          feeAmount: policy.registrationFee,
          qualifyingReferralsCount: eligibleCount,
          status: RefundStatus.ELIGIBLE,
        });

        NotificationService.createNotification({
          userId: user._id.toString(),
          type: NotificationType.REFUND_ELIGIBLE,
          title: 'Registration Fee Refund Eligible',
          message: 'You have verified 10 direct referrals and are now eligible for a 100% refund of your Rs. 15,000 registration fee!',
          link: '/referrals',
          sendEmail: true,
        }).catch(() => {});
      } else if (existingRefund.status === RefundStatus.INELIGIBLE) {
        existingRefund.status = RefundStatus.ELIGIBLE;
        existingRefund.qualifyingReferralsCount = eligibleCount;
        await existingRefund.save();

        NotificationService.createNotification({
          userId: user._id.toString(),
          type: NotificationType.REFUND_ELIGIBLE,
          title: 'Registration Fee Refund Eligible',
          message: 'You have verified 10 direct referrals and are now eligible for a 100% refund of your Rs. 15,000 registration fee!',
          link: '/referrals',
          sendEmail: true,
        }).catch(() => {});
      }
    }
  }

  // ─── User Claims Registration Fee Refund ────────────────────────────────────
  public static async requestRegistrationFeeRefund(
    userId: string,
    payoutMethod: RefundPayoutMethod,
    payoutDetails?: {
      accountTitle?: string | undefined;
      accountNumber?: string | undefined;
      bankName?: string | undefined;
      iban?: string | undefined;
    }
  ): Promise<IRegistrationRefundDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.registrationPaymentStatus !== RegistrationPaymentStatus.PAID) {
      throw new BadRequestError('User has not paid the registration fee.');
    }

    const policy = await SystemSettingService.getReferralCommissionPolicy();
    const eligibleCount = await Referral.countDocuments({
      referrer: user._id,
      level: 1,
      isEligibleForMilestone: true,
      status: ReferralStatus.COMMISSION_CREDITED,
    });

    if (eligibleCount < policy.refundEligibilityThreshold) {
      throw new BadRequestError(
        `You need at least ${policy.refundEligibilityThreshold} verified direct referrals to claim a fee refund. Current eligible: ${eligibleCount}.`
      );
    }

    let refund = await RegistrationRefund.findOne({ user: user._id });
    if (!refund) {
      const regPayment = await RegistrationPayment.findOne({
        user: user._id,
        paymentStatus: RegPaymentStatus.SUCCESS,
      });

      refund = await RegistrationRefund.create({
        user: user._id,
        registrationPayment: regPayment?._id,
        feeAmount: policy.registrationFee,
        qualifyingReferralsCount: eligibleCount,
        status: RefundStatus.ELIGIBLE,
      });
    }

    if (
      refund.status === RefundStatus.REQUESTED ||
      refund.status === RefundStatus.UNDER_REVIEW ||
      refund.status === RefundStatus.APPROVED ||
      refund.status === RefundStatus.COMPLETED
    ) {
      throw new ConflictError(`A refund claim is already in status '${refund.status}'.`);
    }

    refund.status = RefundStatus.REQUESTED;
    refund.payoutMethod = payoutMethod;
    if (payoutDetails) {
      refund.payoutDetails = payoutDetails;
    }
    refund.requestedAt = new Date();
    await refund.save();

    await AuditLog.create({
      actor: user._id,
      action: AuditAction.FEE_REFUND_APPROVED,
      target: refund._id,
      targetModel: 'RegistrationRefund',
      description: `User ${user.email} submitted a registration fee refund request via ${payoutMethod}.`,
    });

    return refund;
  }

  // ─── Admin Endpoints ────────────────────────────────────────────────────────
  public static async adminGetReferrals(params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    status?: string | undefined;
    referrerId?: string | undefined;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (params?.status && params.status !== 'all') {
      query['status'] = params.status;
    }

    if (params?.referrerId) {
      query['referrer'] = new mongoose.Types.ObjectId(params.referrerId);
    }

    if (params?.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query['$or'] = [
        { referrer: { $in: userIds } },
        { referee: { $in: userIds } },
        { referralCode: searchRegex },
      ];
    }

    const [total, referrals] = await Promise.all([
      Referral.countDocuments(query),
      Referral.find(query)
        .populate('referrer', 'name email phone referralCode')
        .populate('referee', 'name email phone accountStatus registrationPaymentStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      data: referrals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  public static async adminReverseReferral(
    referralId: string,
    adminId: string,
    reason: string
  ): Promise<IReferralDocument> {
    const referral = await Referral.findById(referralId);
    if (!referral) {
      throw new NotFoundError('Referral record not found.');
    }

    if (referral.status === ReferralStatus.REVERSED) {
      throw new BadRequestError('Referral is already marked as reversed.');
    }

    const previousStatus = referral.status;
    referral.status = ReferralStatus.REVERSED;
    referral.isEligibleForMilestone = false;
    referral.reversalReason = reason;
    referral.reversedAt = new Date();
    referral.reversedBy = new mongoose.Types.ObjectId(adminId);
    await referral.save();

    // If commission was already credited, debit the referrer wallet via an immutable REVERSAL transaction
    if (referral.commissionAmount > 0) {
      const wallet = await Wallet.findOne({ user: referral.referrer });
      if (wallet) {
        const debitAmount = referral.commissionAmount;
        const balanceBefore = wallet.availableBalance;
        const balanceAfter = Math.max(0, balanceBefore - debitAmount);

        wallet.availableBalance = balanceAfter;
        wallet.referralCommissions = Math.max(0, wallet.referralCommissions - debitAmount);
        wallet.totalEarned = Math.max(0, wallet.totalEarned - debitAmount);
        await wallet.save();

        await WalletTransaction.create({
          wallet: wallet._id,
          user: referral.referrer,
          type: TransactionType.REVERSAL,
          direction: TransactionDirection.DEBIT,
          status: TransactionStatus.COMPLETED,
          amount: debitAmount,
          currency: 'PKR',
          balanceBefore,
          balanceAfter,
          description: `Referral commission reversed by admin. Reason: ${reason}`,
          idempotencyKey: `REVERSAL-REF-${referral._id.toString()}`,
          sourceReference: referral._id.toString(),
          sourceModel: 'Referral',
          processedBy: new mongoose.Types.ObjectId(adminId),
        });

        // Cancel the commission record
        await Commission.findOneAndUpdate(
          { referral: referral._id, type: CommissionType.REFERRAL },
          { status: CommissionStatus.CANCELLED }
        );
      }
    }

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.REFERRAL_REVERSED,
      target: referral._id,
      targetModel: 'Referral',
      description: `Referral ${referralId} reversed by admin. Previous status: ${previousStatus}. Reason: ${reason}`,
    });

    return referral;
  }

  public static async adminGetMilestones(params?: { page?: number | undefined; limit?: number | undefined }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 20));
    const skip = (page - 1) * limit;

    const [total, milestones] = await Promise.all([
      MilestoneAchievement.countDocuments(),
      MilestoneAchievement.find()
        .populate('user', 'name email phone referralCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      data: milestones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  public static async adminGetRefunds(params?: {
    page?: number | undefined;
    limit?: number | undefined;
    status?: string | undefined;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (params?.status && params.status !== 'all') {
      query['status'] = params.status;
    }

    const [total, refunds] = await Promise.all([
      RegistrationRefund.countDocuments(query),
      RegistrationRefund.find(query)
        .populate('user', 'name email phone referralCode')
        .populate('registrationPayment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      data: refunds,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  public static async adminProcessRefund(
    refundId: string,
    adminId: string,
    action: 'approve' | 'reject' | 'complete',
    notes?: string,
    transactionReference?: string
  ): Promise<IRegistrationRefundDocument> {
    const refund = await RegistrationRefund.findById(refundId);
    if (!refund) {
      throw new NotFoundError('Refund record not found.');
    }

    if (refund.status === RefundStatus.COMPLETED) {
      throw new BadRequestError('This refund has already been completed.');
    }

    refund.reviewedBy = new mongoose.Types.ObjectId(adminId);
    refund.reviewedAt = new Date();
    if (notes) {
      refund.adminNotes = notes.trim();
    }

    if (action === 'reject') {
      refund.status = RefundStatus.REJECTED;
      refund.rejectionReason = notes || 'Refund request rejected after review.';
      await refund.save();

      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(adminId),
        action: AuditAction.FEE_REFUND_REJECTED,
        target: refund._id,
        targetModel: 'RegistrationRefund',
        description: `Registration fee refund rejected for user ${refund.user}. Reason: ${refund.rejectionReason}`,
      });

      NotificationService.createNotification({
        userId: refund.user.toString(),
        type: NotificationType.REFUND_COMPLETED,
        title: 'Refund Request Update',
        message: `Your registration fee refund request was rejected. Reason: ${refund.rejectionReason}`,
        referenceId: refund._id.toString(),
        referenceModel: 'RegistrationRefund',
        link: '/referrals',
        sendEmail: true,
      }).catch(() => {});

      return refund;
    }

    // Process approval or completion
    if (action === 'approve' || action === 'complete') {
      // If payout method is wallet credit, credit available balance (not commission!)
      if (refund.payoutMethod === RefundPayoutMethod.WALLET_CREDIT) {
        let wallet = await Wallet.findOne({ user: refund.user });
        if (!wallet) {
          wallet = await Wallet.create({ user: refund.user });
        }

        const refundPaisa = refund.feeAmount; // 1500000 = Rs. 15,000
        const balanceBefore = wallet.availableBalance;
        const balanceAfter = balanceBefore + refundPaisa;

        wallet.availableBalance = balanceAfter;
        // CRITICAL SPEC REQUIREMENT:
        // "Refund is a separate transaction, not referral commission. Never count the user's own registration payment as earnings."
        // We add to refundCredits only, NOT totalEarned/referralCommissions.
        wallet.refundCredits += refundPaisa;
        await wallet.save();

        const walletTx = await WalletTransaction.create({
          wallet: wallet._id,
          user: refund.user,
          type: TransactionType.REGISTRATION_REFUND,
          direction: TransactionDirection.CREDIT,
          status: TransactionStatus.COMPLETED,
          amount: refundPaisa,
          currency: 'PKR',
          balanceBefore,
          balanceAfter,
          description: `Registration fee refund credited to wallet (10 qualifying referrals verified)`,
          idempotencyKey: `REGREFUND-${refund._id.toString()}`,
          sourceReference: refund._id.toString(),
          sourceModel: 'RegistrationRefund',
          processedBy: new mongoose.Types.ObjectId(adminId),
        });

        refund.walletTransaction = walletTx._id;
        refund.transactionReference = `REFUND-CX-${Date.now()}`;
      } else if (transactionReference) {
        refund.transactionReference = transactionReference.trim();
      }

      refund.status = RefundStatus.COMPLETED;
      refund.paidAt = new Date();
      await refund.save();

      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(adminId),
        action: AuditAction.FEE_REFUND_COMPLETED,
        target: refund._id,
        targetModel: 'RegistrationRefund',
        description: `Registration fee refund of Rs. ${refund.feeAmount / 100} completed for user ${refund.user}. Method: ${refund.payoutMethod}`,
      });

      NotificationService.createNotification({
        userId: refund.user.toString(),
        type: NotificationType.REFUND_COMPLETED,
        title: 'Registration Fee Refund Paid',
        message: `Your 100% registration fee refund of Rs. ${refund.feeAmount / 100} has been processed via ${refund.payoutMethod}!`,
        referenceId: refund._id.toString(),
        referenceModel: 'RegistrationRefund',
        link: '/wallet',
        sendEmail: true,
      }).catch(() => {});
    }

    return refund;
  }
}
