/**
 * WalletService – atomic balance operations with immutable ledger entries.
 *
 * INVARIANT: availableBalance must never go below 0.
 * Every balance mutation MUST produce a WalletTransaction record inside the same
 * mongoose session (atomic transaction).
 */
import mongoose from 'mongoose';
import crypto from 'crypto';

import { Wallet } from './wallet.model.js';
import {
  WalletTransaction,
  TransactionType,
  TransactionDirection,
  TransactionStatus,
} from '../transactions/walletTransaction.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { BadRequestError, NotFoundError } from '../../common/errors.js';

// ─── Helper ────────────────────────────────────────────────────────────────────
function generateIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

async function runWithTransactionFallback<T>(
  fn: (session?: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err: unknown) {
    if (session) {
      await session.abortTransaction().catch(() => {});
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('replica set member or mongos') ||
      msg.includes('Transaction numbers are only allowed')
    ) {
      // Standalone MongoDB dev fallback: executes without transaction session
      return await fn(undefined);
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export class WalletService {
  // ─── Ensure Wallet Exists ─────────────────────────────────────────────────
  public static async ensureWallet(userId: string) {
    const existing = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (existing) return existing;
    return Wallet.create({ user: new mongoose.Types.ObjectId(userId) });
  }

  // ─── Get Wallet ───────────────────────────────────────────────────────────
  public static async getWallet(userId: string) {
    const wallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) }).lean();
    if (!wallet) throw new NotFoundError('Wallet not found.');
    return wallet;
  }

  // ─── Get Wallet Summary (for user dashboard) ───────────────────────────────
  public static async getWalletSummary(userId: string) {
    const wallet = await this.getWallet(userId);
    return {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn,
      totalEarned: wallet.totalEarned,
      breakdown: {
        taskEarnings: wallet.taskEarnings,
        referralCommissions: wallet.referralCommissions,
        referralBonuses: wallet.referralBonuses,
        refundCredits: wallet.refundCredits,
      },
    };
  }

  // ─── Atomic Credit ─────────────────────────────────────────────────────────
  /**
   * Credit availableBalance atomically. Creates a ledger entry.
   * @param idempotencyKey – caller must supply a unique key; duplicate keys are rejected silently.
   */
  public static async credit(params: {
    userId: string;
    amount: number;
    type: TransactionType;
    description: string;
    idempotencyKey: string;
    sourceReference?: string;
    sourceModel?: string;
    processedBy?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (params.amount <= 0) throw new BadRequestError('Credit amount must be positive.');

    // Check idempotency
    const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
    if (existing) return existing;

    return runWithTransactionFallback(async (session) => {
      const wallet = await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(params.userId) },
        { $inc: { availableBalance: params.amount } },
        { new: true, ...(session ? { session } : {}), upsert: true }
      );
      if (!wallet) throw new Error('Wallet not found during credit.');

      // Update lifetime totals per type
      const totalsUpdate = WalletService._buildTotalsCredit(params.type, params.amount);
      await Wallet.findByIdAndUpdate(
        wallet._id,
        { $inc: totalsUpdate },
        session ? { session } : {}
      );

      const tx = await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: new mongoose.Types.ObjectId(params.userId),
            type: params.type,
            direction: TransactionDirection.CREDIT,
            status: TransactionStatus.COMPLETED,
            amount: params.amount,
            currency: 'PKR',
            balanceBefore: wallet.availableBalance - params.amount,
            balanceAfter: wallet.availableBalance,
            description: params.description,
            idempotencyKey: params.idempotencyKey,
            sourceReference: params.sourceReference,
            sourceModel: params.sourceModel,
            processedBy: params.processedBy
              ? new mongoose.Types.ObjectId(params.processedBy)
              : undefined,
            metadata: params.metadata,
          },
        ],
        session ? { session } : {}
      );

      return tx[0];
    });
  }

  // ─── Reserve for Withdrawal (debit pending) ────────────────────────────────
  public static async reserveForWithdrawal(params: {
    userId: string;
    amount: number;
    withdrawalId: string;
    idempotencyKey: string;
  }) {
    if (params.amount <= 0) throw new BadRequestError('Amount must be positive.');

    const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
    if (existing) return existing;

    return runWithTransactionFallback(async (session) => {
      const wallet = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(params.userId) },
        null,
        session ? { session } : {}
      );
      if (!wallet) throw new NotFoundError('Wallet not found.');
      if (wallet.availableBalance < params.amount) {
        throw new BadRequestError('Insufficient available balance.');
      }

      wallet.availableBalance -= params.amount;
      wallet.pendingBalance += params.amount;
      await wallet.save(session ? { session } : {});

      const tx = await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: new mongoose.Types.ObjectId(params.userId),
            type: TransactionType.WITHDRAWAL,
            direction: TransactionDirection.DEBIT,
            status: TransactionStatus.PENDING,
            amount: params.amount,
            currency: 'PKR',
            balanceBefore: wallet.availableBalance + params.amount,
            balanceAfter: wallet.availableBalance,
            description: 'Withdrawal request – funds reserved, pending approval',
            idempotencyKey: params.idempotencyKey,
            sourceReference: params.withdrawalId,
            sourceModel: 'Withdrawal',
          },
        ],
        session ? { session } : {}
      );

      return tx[0];
    });
  }

  // ─── Finalize Withdrawal (complete payout) ─────────────────────────────────
  public static async finalizeWithdrawal(params: {
    userId: string;
    amount: number;
    withdrawalId: string;
    processedBy: string;
    idempotencyKey: string;
  }) {
    const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
    if (existing) return existing;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const wallet = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(params.userId) },
        null,
        { session }
      );
      if (!wallet) throw new NotFoundError('Wallet not found.');
      if (wallet.pendingBalance < params.amount) {
        throw new BadRequestError('Pending balance mismatch during finalization.');
      }

      wallet.pendingBalance -= params.amount;
      wallet.totalWithdrawn += params.amount;
      await wallet.save({ session });

      // Update the pending ledger entry to completed
      const updatedTx = await WalletTransaction.findOneAndUpdate(
        {
          sourceReference: params.withdrawalId,
          sourceModel: 'Withdrawal',
          status: TransactionStatus.PENDING,
        },
        { status: TransactionStatus.COMPLETED },
        { session, new: true }
      );

      await session.commitTransaction();
      return updatedTx;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ─── Release Reserved Withdrawal (on rejection/failure) ────────────────────
  public static async releaseReservedWithdrawal(params: {
    userId: string;
    amount: number;
    withdrawalId: string;
    idempotencyKey: string;
  }) {
    const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
    if (existing) return existing;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const wallet = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(params.userId) },
        null,
        { session }
      );
      if (!wallet) throw new NotFoundError('Wallet not found.');

      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - params.amount);
      wallet.availableBalance += params.amount;
      await wallet.save({ session });

      // Mark original pending debit as reversed
      await WalletTransaction.findOneAndUpdate(
        {
          sourceReference: params.withdrawalId,
          sourceModel: 'Withdrawal',
          status: TransactionStatus.PENDING,
        },
        { status: TransactionStatus.REVERSED },
        { session }
      );

      // Create reversal entry
      const tx = await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: new mongoose.Types.ObjectId(params.userId),
            type: TransactionType.REVERSAL,
            direction: TransactionDirection.CREDIT,
            status: TransactionStatus.COMPLETED,
            amount: params.amount,
            currency: 'PKR',
            balanceBefore: wallet.availableBalance - params.amount,
            balanceAfter: wallet.availableBalance,
            description: 'Withdrawal rejected/failed – reserved funds released',
            idempotencyKey: params.idempotencyKey,
            sourceReference: params.withdrawalId,
            sourceModel: 'Withdrawal',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return tx[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ─── Admin Manual Adjustment ────────────────────────────────────────────────
  public static async adminAdjustment(params: {
    userId: string;
    amount: number;
    direction: 'credit' | 'debit';
    reason: string;
    reference?: string;
    adminId: string;
  }) {
    if (params.amount <= 0) throw new BadRequestError('Adjustment amount must be positive.');
    const idempotencyKey = generateIdempotencyKey('ADJ');

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const wallet = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(params.userId) },
        null,
        { session }
      );
      if (!wallet) throw new NotFoundError('Wallet not found.');

      if (params.direction === 'debit' && wallet.availableBalance < params.amount) {
        throw new BadRequestError('Insufficient balance for debit adjustment.');
      }

      const delta = params.direction === 'credit' ? params.amount : -params.amount;
      wallet.availableBalance += delta;
      await wallet.save({ session });

      const tx = await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: new mongoose.Types.ObjectId(params.userId),
            type: TransactionType.ADJUSTMENT,
            direction:
              params.direction === 'credit'
                ? TransactionDirection.CREDIT
                : TransactionDirection.DEBIT,
            status: TransactionStatus.COMPLETED,
            amount: params.amount,
            currency: 'PKR',
            balanceBefore:
              params.direction === 'credit'
                ? wallet.availableBalance - params.amount
                : wallet.availableBalance + params.amount,
            balanceAfter: wallet.availableBalance,
            description: `Admin adjustment: ${params.reason}`,
            idempotencyKey,
            sourceReference: params.reference,
            processedBy: new mongoose.Types.ObjectId(params.adminId),
          },
        ],
        { session }
      );

      await AuditLog.create(
        [
          {
            actor: new mongoose.Types.ObjectId(params.adminId),
            action: AuditAction.WALLET_ADJUSTED,
            target: new mongoose.Types.ObjectId(params.userId),
            targetModel: 'User',
            description: `Admin ${params.direction} adjustment of Rs. ${params.amount / 100} on user wallet. Reason: ${params.reason}`,
            changes: { direction: params.direction, amount: params.amount, reason: params.reason },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return tx[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ─── Transaction History ───────────────────────────────────────────────────
  public static async getTransactionHistory(params: {
    userId: string;
    page?: number;
    limit?: number;
    type?: string;
    direction?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const filter: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(params.userId),
    };

    if (params.type) filter.type = params.type;
    if (params.direction) filter.direction = params.direction;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      filter.createdAt = dateFilter;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    return {
      transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ─── Admin: All wallets overview ────────────────────────────────────────────
  public static async getWalletsAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const [wallets, total] = await Promise.all([
      Wallet.find({})
        .populate('user', 'name email phone referralCode accountStatus')
        .sort({ availableBalance: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Wallet.countDocuments({}),
    ]);

    return {
      wallets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Admin: Global Transaction Ledger ─────────────────────────────────────
  public static async getAdminLedger(params: {
    page?: number;
    limit?: number;
    type?: string;
    direction?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (params.type) filter.type = params.type;
    if (params.direction) filter.direction = params.direction;
    if (params.userId) filter.user = new mongoose.Types.ObjectId(params.userId);
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      filter.createdAt = dateFilter;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .populate('user', 'name email')
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    return {
      transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Financial Summary (for admin reporting) ────────────────────────────────
  public static async getFinancialSummary(params: {
    startDate?: string;
    endDate?: string;
  }) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter.$gte = new Date(params.startDate);
    if (params.endDate) dateFilter.$lte = new Date(params.endDate);

    const matchStage = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [result] = await WalletTransaction.aggregate([
      { $match: { status: TransactionStatus.COMPLETED, ...matchStage } },
      {
        $group: {
          _id: null,
          totalDeposits: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.DEPOSIT] },
                '$amount',
                0,
              ],
            },
          },
          totalWithdrawals: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.WITHDRAWAL] },
                '$amount',
                0,
              ],
            },
          },
          totalTaskRewards: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.TASK_REWARD] },
                '$amount',
                0,
              ],
            },
          },
          totalReferralCommissions: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.REFERRAL_COMMISSION] },
                '$amount',
                0,
              ],
            },
          },
          totalReferralBonuses: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.REFERRAL_BONUS] },
                '$amount',
                0,
              ],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.REGISTRATION_REFUND] },
                '$amount',
                0,
              ],
            },
          },
          totalAdjustments: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.ADJUSTMENT] },
                '$amount',
                0,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Pending liabilities
    const [pending] = await WalletTransaction.aggregate([
      { $match: { status: TransactionStatus.PENDING } },
      {
        $group: {
          _id: null,
          pendingWithdrawals: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.WITHDRAWAL] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      ...(result || {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalTaskRewards: 0,
        totalReferralCommissions: 0,
        totalReferralBonuses: 0,
        totalRefunds: 0,
        totalAdjustments: 0,
        count: 0,
      }),
      pendingWithdrawals: pending?.pendingWithdrawals ?? 0,
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────
  private static _buildTotalsCredit(type: TransactionType, amount: number) {
    const inc: Record<string, number> = { totalEarned: amount };
    switch (type) {
      case TransactionType.DEPOSIT:
        inc.totalDeposited = amount;
        delete inc.totalEarned;
        break;
      case TransactionType.TASK_REWARD:
        inc.taskEarnings = amount;
        break;
      case TransactionType.REFERRAL_COMMISSION:
        inc.referralCommissions = amount;
        break;
      case TransactionType.REFERRAL_BONUS:
        inc.referralBonuses = amount;
        break;
      case TransactionType.REGISTRATION_REFUND:
        inc.refundCredits = amount;
        break;
      default:
        // ADJUSTMENT, REVERSAL: don't count toward totalEarned
        delete inc.totalEarned;
        break;
    }
    return inc;
  }
}

