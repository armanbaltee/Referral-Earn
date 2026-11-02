import mongoose from 'mongoose';
import crypto from 'crypto';

import { Withdrawal, WithdrawalStatus } from './withdrawal.model.js';
import { PaymentMethod } from '../deposits/deposit.model.js';
import { WalletService } from '../wallet/wallet.service.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors.js';

export const MIN_WITHDRAWAL_PAISA = 100_00; // Rs. 100
export const MAX_WITHDRAWAL_PAISA = 50_000_00; // Rs. 50,000

export class WithdrawalService {
  // ─── User: Submit Withdrawal Request ──────────────────────────────────────
  public static async submitWithdrawal(params: {
    userId: string;
    amount: number; // in paisa
    paymentMethod: 'easypaisa' | 'jazzcash';
    accountTitle: string;
    accountNumber: string;
  }) {
    if (params.amount < MIN_WITHDRAWAL_PAISA) {
      throw new BadRequestError(
        `Minimum withdrawal is Rs. ${MIN_WITHDRAWAL_PAISA / 100}.`
      );
    }
    if (params.amount > MAX_WITHDRAWAL_PAISA) {
      throw new BadRequestError(
        `Maximum single withdrawal is Rs. ${MAX_WITHDRAWAL_PAISA / 100}.`
      );
    }

    const accountTitle = params.accountTitle.trim();
    const accountNumber = params.accountNumber.trim();
    if (!accountTitle) throw new BadRequestError('Account title is required.');
    if (!accountNumber) throw new BadRequestError('Account number is required.');

    // Validate phone-like number for mobile wallets
    if (!/^03\d{9}$/.test(accountNumber)) {
      throw new BadRequestError(
        'Account number must be a valid Pakistani mobile number (03XXXXXXXXX).'
      );
    }

    // Check available balance before reserving
    const wallet = await WalletService.getWallet(params.userId);
    if (wallet.availableBalance < params.amount) {
      throw new BadRequestError(
        `Insufficient available balance. Available: Rs. ${wallet.availableBalance / 100}.`
      );
    }

    // Prevent multiple pending withdrawal requests
    const existingPending = await Withdrawal.findOne({
      user: new mongoose.Types.ObjectId(params.userId),
      status: { $in: [WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW, WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING] },
    });
    if (existingPending) {
      throw new ConflictError(
        'You already have a pending withdrawal request. Please wait for it to be processed.'
      );
    }

    const idempotencyKey = `WITHDRAWAL-${params.userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const withdrawal = await Withdrawal.create({
      user: new mongoose.Types.ObjectId(params.userId),
      amount: params.amount,
      currency: 'PKR',
      paymentMethod: params.paymentMethod as PaymentMethod,
      accountTitle,
      accountNumber,
      status: WithdrawalStatus.PENDING,
      idempotencyKey,
    });

    // Reserve the funds immediately
    const reserveKey = `RESERVE-${withdrawal._id.toString()}`;
    const tx = await WalletService.reserveForWithdrawal({
      userId: params.userId,
      amount: params.amount,
      withdrawalId: withdrawal._id.toString(),
      idempotencyKey: reserveKey,
    });

    withdrawal.reservedAt = new Date();
    withdrawal.walletTransaction = tx._id as mongoose.Types.ObjectId;
    await withdrawal.save();

    return withdrawal;
  }

  // ─── User: Get My Withdrawals ──────────────────────────────────────────────
  public static async getUserWithdrawals(params: {
    userId: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(50, Math.max(1, Number(params.limit || 10)));
    const filter: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(params.userId),
    };
    if (params.status) filter.status = params.status;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Withdrawal.countDocuments(filter),
    ]);

    return {
      withdrawals,
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

  // ─── Admin: Get All Withdrawals ────────────────────────────────────────────
  public static async getWithdrawalsAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (params.status) filter.status = params.status;
    if (params.paymentMethod) filter.paymentMethod = params.paymentMethod;
    if (params.userId) filter.user = new mongoose.Types.ObjectId(params.userId);
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      filter.createdAt = dateFilter;
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(filter)
        .populate('user', 'name email phone referralCode')
        .populate('reviewedBy', 'name email')
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(filter),
    ]);

    return {
      withdrawals,
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

  // ─── Admin: Approve Withdrawal (moves to APPROVED – not yet paid) ──────────
  public static async adminApproveWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    adminNotes?: string;
  }) {
    const withdrawal = await Withdrawal.findById(params.withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');

    const allowed = [WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW];
    if (!allowed.includes(withdrawal.status)) {
      throw new BadRequestError(
        `Cannot approve a withdrawal with status: ${withdrawal.status}.`
      );
    }

    withdrawal.status = WithdrawalStatus.APPROVED;
    withdrawal.reviewedBy = new mongoose.Types.ObjectId(params.adminId);
    withdrawal.reviewedAt = new Date();
    if (params.adminNotes) withdrawal.adminNotes = params.adminNotes.trim();
    await withdrawal.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(params.adminId),
      action: AuditAction.WITHDRAWAL_APPROVED,
      target: withdrawal._id,
      targetModel: 'Withdrawal',
      description: `Withdrawal approved: Rs. ${withdrawal.amount / 100} to ${withdrawal.paymentMethod} ${withdrawal.accountNumber}. Notes: ${params.adminNotes || 'None'}`,
    });

    return withdrawal;
  }

  // ─── Admin: Complete Withdrawal (payout executed) ─────────────────────────
  /**
   * Called ONLY after the actual mobile money payout has been dispatched.
   * This finalizes the pending debit in the ledger.
   */
  public static async adminCompleteWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    gatewayTransactionId?: string;
    adminNotes?: string;
  }) {
    const withdrawal = await Withdrawal.findById(params.withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');

    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestError(
        `Only APPROVED withdrawals can be marked as completed. Current status: ${withdrawal.status}`
      );
    }

    const finalizeKey = `FINALIZE-WITHDRAWAL-${withdrawal._id.toString()}`;

    withdrawal.status = WithdrawalStatus.COMPLETED;
    withdrawal.processedBy = new mongoose.Types.ObjectId(params.adminId);
    withdrawal.processedAt = new Date();
    withdrawal.completedAt = new Date();
    if (params.gatewayTransactionId) withdrawal.gatewayTransactionId = params.gatewayTransactionId;
    if (params.adminNotes) withdrawal.adminNotes = params.adminNotes?.trim();
    await withdrawal.save();

    // Finalize the debit in the ledger
    await WalletService.finalizeWithdrawal({
      userId: withdrawal.user.toString(),
      amount: withdrawal.amount,
      withdrawalId: withdrawal._id.toString(),
      processedBy: params.adminId,
      idempotencyKey: finalizeKey,
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(params.adminId),
      action: AuditAction.WITHDRAWAL_COMPLETED,
      target: withdrawal._id,
      targetModel: 'Withdrawal',
      description: `Withdrawal completed: Rs. ${withdrawal.amount / 100} to ${withdrawal.paymentMethod} ${withdrawal.accountNumber}. Gateway TID: ${params.gatewayTransactionId || 'N/A'}`,
    });

    return withdrawal;
  }

  // ─── Admin: Reject Withdrawal (release reserved amount) ───────────────────
  public static async adminRejectWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    reason: string;
    adminNotes?: string;
  }) {
    if (!params.reason?.trim()) throw new BadRequestError('A rejection reason is required.');

    const withdrawal = await Withdrawal.findById(params.withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');

    const terminalStatuses = [WithdrawalStatus.COMPLETED, WithdrawalStatus.REJECTED, WithdrawalStatus.FAILED];
    if (terminalStatuses.includes(withdrawal.status)) {
      throw new BadRequestError(`Cannot reject a withdrawal with status: ${withdrawal.status}.`);
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.rejectionReason = params.reason.trim();
    withdrawal.reviewedBy = new mongoose.Types.ObjectId(params.adminId);
    withdrawal.reviewedAt = new Date();
    if (params.adminNotes) withdrawal.adminNotes = params.adminNotes.trim();
    await withdrawal.save();

    // Release reserved funds – exactly once
    const releaseKey = `RELEASE-WITHDRAWAL-${withdrawal._id.toString()}`;
    await WalletService.releaseReservedWithdrawal({
      userId: withdrawal.user.toString(),
      amount: withdrawal.amount,
      withdrawalId: withdrawal._id.toString(),
      idempotencyKey: releaseKey,
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(params.adminId),
      action: AuditAction.WITHDRAWAL_REJECTED,
      target: withdrawal._id,
      targetModel: 'Withdrawal',
      description: `Withdrawal rejected: Rs. ${withdrawal.amount / 100}. Reason: ${params.reason}. Funds returned to user wallet.`,
    });

    return withdrawal;
  }

  // ─── Admin: Mark Withdrawal Failed (release reserved amount) ──────────────
  public static async adminFailWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    reason: string;
  }) {
    const withdrawal = await Withdrawal.findById(params.withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');

    if (withdrawal.status === WithdrawalStatus.COMPLETED) {
      throw new BadRequestError('Cannot fail a completed withdrawal.');
    }

    withdrawal.status = WithdrawalStatus.FAILED;
    withdrawal.rejectionReason = params.reason.trim();
    withdrawal.processedBy = new mongoose.Types.ObjectId(params.adminId);
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    const releaseKey = `FAIL-RELEASE-WITHDRAWAL-${withdrawal._id.toString()}`;
    await WalletService.releaseReservedWithdrawal({
      userId: withdrawal.user.toString(),
      amount: withdrawal.amount,
      withdrawalId: withdrawal._id.toString(),
      idempotencyKey: releaseKey,
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(params.adminId),
      action: AuditAction.WITHDRAWAL_FAILED,
      target: withdrawal._id,
      targetModel: 'Withdrawal',
      description: `Withdrawal failed: Rs. ${withdrawal.amount / 100}. Reason: ${params.reason}. Funds released.`,
    });

    return withdrawal;
  }
}

