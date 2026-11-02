import mongoose from 'mongoose';
import crypto from 'crypto';

import { Deposit, DepositStatus, PaymentMethod } from './deposit.model.js';
import { WalletService } from '../wallet/wallet.service.js';
import { TransactionType } from '../transactions/walletTransaction.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { SystemSettingService } from '../admin/systemSetting.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors.js';

export const MIN_DEPOSIT_PAISA = 100_00; // Rs. 100
export const MAX_DEPOSIT_PAISA = 100_000_00; // Rs. 100,000

export class DepositService {
  // ─── User: Submit Manual Deposit ──────────────────────────────────────────
  public static async submitManualDeposit(params: {
    userId: string;
    amount: number; // in paisa
    paymentMethod: 'easypaisa' | 'jazzcash';
    paymentReference: string;
    proofImageUrl?: string;
    senderNotes?: string;
  }) {
    if (params.amount < MIN_DEPOSIT_PAISA) {
      throw new BadRequestError(
        `Minimum deposit is Rs. ${MIN_DEPOSIT_PAISA / 100}. You entered Rs. ${params.amount / 100}.`
      );
    }
    if (params.amount > MAX_DEPOSIT_PAISA) {
      throw new BadRequestError(
        `Maximum single deposit is Rs. ${MAX_DEPOSIT_PAISA / 100}.`
      );
    }

    const paymentRef = params.paymentReference.trim();
    if (!paymentRef) throw new BadRequestError('Transaction reference is required.');

    // Prevent duplicate pending deposit with same reference for same user
    const existing = await Deposit.findOne({
      user: new mongoose.Types.ObjectId(params.userId),
      paymentReference: paymentRef,
      status: { $in: [DepositStatus.PENDING, DepositStatus.UNDER_REVIEW] },
    });
    if (existing) {
      throw new ConflictError(
        'A deposit with this transaction reference is already pending review.'
      );
    }

    const idempotencyKey = `DEPOSIT-MANUAL-${params.userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const deposit = await Deposit.create({
      user: new mongoose.Types.ObjectId(params.userId),
      amount: params.amount,
      currency: 'PKR',
      paymentMethod: params.paymentMethod as PaymentMethod,
      status: DepositStatus.PENDING,
      paymentReference: paymentRef,
      proofImageUrl: params.proofImageUrl,
      senderNotes: params.senderNotes,
      idempotencyKey,
    });

    // Ensure wallet exists
    await WalletService.ensureWallet(params.userId);

    return deposit;
  }

  // ─── User: Get My Deposits ─────────────────────────────────────────────────
  public static async getUserDeposits(params: {
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

    const [deposits, total] = await Promise.all([
      Deposit.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Deposit.countDocuments(filter),
    ]);

    return {
      deposits,
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

  // ─── Admin: Get All Deposits ───────────────────────────────────────────────
  public static async getDepositsAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    userId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (params.status) filter.status = params.status;
    if (params.paymentMethod) filter.paymentMethod = params.paymentMethod;
    if (params.userId) filter.user = new mongoose.Types.ObjectId(params.userId);
    if (params.search) {
      filter.paymentReference = { $regex: params.search.trim(), $options: 'i' };
    }
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      filter.createdAt = dateFilter;
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(filter)
        .populate('user', 'name email phone referralCode')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Deposit.countDocuments(filter),
    ]);

    return {
      deposits,
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

  // ─── Admin: Approve Deposit ────────────────────────────────────────────────
  public static async adminApproveDeposit(params: {
    depositId: string;
    adminId: string;
    adminNotes?: string;
  }) {
    const deposit = await Deposit.findById(params.depositId);
    if (!deposit) throw new NotFoundError('Deposit not found.');
    if (deposit.status === DepositStatus.COMPLETED) {
      throw new ConflictError('Deposit has already been approved and credited.');
    }
    if (deposit.status === DepositStatus.REJECTED) {
      throw new BadRequestError('Cannot approve a rejected deposit.');
    }

    const idempotencyKey = `DEPOSIT-CREDIT-${deposit._id.toString()}`;

    // Atomic: credit wallet + update deposit in session
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      deposit.status = DepositStatus.COMPLETED;
      deposit.reviewedBy = new mongoose.Types.ObjectId(params.adminId);
      deposit.reviewedAt = new Date();
      deposit.completedAt = new Date();
      if (params.adminNotes) deposit.adminNotes = params.adminNotes.trim();
      await deposit.save({ session });

      // Credit wallet
      const tx = await WalletService.credit({
        userId: deposit.user.toString(),
        amount: deposit.amount,
        type: TransactionType.DEPOSIT,
        description: `Deposit approved: ${deposit.paymentMethod.toUpperCase()} – Ref: ${deposit.paymentReference || 'N/A'}`,
        idempotencyKey,
        sourceReference: deposit._id.toString(),
        sourceModel: 'Deposit',
        processedBy: params.adminId,
      });

      deposit.walletTransaction = tx._id as mongoose.Types.ObjectId;
      await deposit.save({ session });

      await AuditLog.create(
        [
          {
            actor: new mongoose.Types.ObjectId(params.adminId),
            action: AuditAction.DEPOSIT_APPROVED,
            target: deposit._id,
            targetModel: 'Deposit',
            description: `Deposit approved: Rs. ${deposit.amount / 100} via ${deposit.paymentMethod}. User: ${deposit.user}. Ref: ${deposit.paymentReference}. Notes: ${params.adminNotes || 'None'}`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return deposit;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ─── Admin: Reject Deposit ─────────────────────────────────────────────────
  public static async adminRejectDeposit(params: {
    depositId: string;
    adminId: string;
    reason: string;
    adminNotes?: string;
  }) {
    if (!params.reason?.trim()) throw new BadRequestError('A rejection reason is required.');

    const deposit = await Deposit.findById(params.depositId);
    if (!deposit) throw new NotFoundError('Deposit not found.');
    if (deposit.status === DepositStatus.COMPLETED) {
      throw new ConflictError('Cannot reject an already completed deposit.');
    }
    if (deposit.status === DepositStatus.REJECTED) {
      throw new ConflictError('Deposit is already rejected.');
    }

    deposit.status = DepositStatus.REJECTED;
    deposit.rejectionReason = params.reason.trim();
    deposit.reviewedBy = new mongoose.Types.ObjectId(params.adminId);
    deposit.reviewedAt = new Date();
    if (params.adminNotes) deposit.adminNotes = params.adminNotes.trim();
    await deposit.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(params.adminId),
      action: AuditAction.DEPOSIT_REJECTED,
      target: deposit._id,
      targetModel: 'Deposit',
      description: `Deposit rejected: Rs. ${deposit.amount / 100} via ${deposit.paymentMethod}. Reason: ${params.reason}`,
    });

    return deposit;
  }

  // ─── Admin: Get payment method instructions ────────────────────────────────
  public static async getPaymentInstructions() {
    const config = await SystemSettingService.getRegistrationFeeConfig();
    return {
      easypaisa: {
        accountTitle: config.easypaisa.accountTitle,
        accountNumber: config.easypaisa.accountNumber,
        instructions: 'Send your deposit amount to the EasyPaisa account above, then enter the TRX ID and upload receipt.',
      },
      jazzcash: {
        accountTitle: config.jazzcash.accountTitle,
        accountNumber: config.jazzcash.accountNumber,
        instructions: 'Send your deposit amount via JazzCash app or retailer till, then enter the TID from your SMS.',
      },
      minDeposit: MIN_DEPOSIT_PAISA,
      maxDeposit: MAX_DEPOSIT_PAISA,
    };
  }
}

