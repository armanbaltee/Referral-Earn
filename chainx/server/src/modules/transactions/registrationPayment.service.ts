import mongoose from 'mongoose';
import {
  RegistrationPayment,
  RegPaymentStatus,
  RegVerificationStatus,
  RegPaymentMode,
  type IRegistrationPaymentDocument,
} from './registrationPayment.model.js';
import { Payment, PaymentStatus, PaymentGateway, PaymentMode } from './payment.model.js';
import { IdempotencyRecord } from './idempotencyRecord.model.js';
import { User } from '../users/user.model.js';
import { AccountStatus, RegistrationPaymentStatus } from '../users/user.types.js';
import { Referral, ReferralStatus } from '../referrals/referral.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { SystemSettingService } from '../admin/systemSetting.service.js';
import { EasypaisaAdapter } from './adapters/easypaisa.adapter.js';
import { JazzcashAdapter } from './adapters/jazzcash.adapter.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors.js';

export class RegistrationPaymentService {
  // ─── Mode A: Manual Payment Submission ─────────────────────────────────────────
  public static async submitManualPayment(
    userId: string,
    data: {
      paymentMethod: 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'manual' | 'crypto';
      paymentReference: string;
      proofImage?: string | undefined;
      notes?: string | undefined;
    }
  ): Promise<IRegistrationPaymentDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.registrationPaymentStatus === RegistrationPaymentStatus.PAID) {
      throw new BadRequestError('Registration fee is already recorded as paid.');
    }

    // Check for duplicate pending submission with same reference
    const existingPending = await RegistrationPayment.findOne({
      user: user._id,
      paymentReference: data.paymentReference.trim(),
      verificationStatus: RegVerificationStatus.PENDING,
    });

    if (existingPending) {
      throw new ConflictError('A payment request with this reference number is already pending verification.');
    }

    // Get dynamic registration fee from database system settings
    const config = await SystemSettingService.getRegistrationFeeConfig();
    const idempotencyKey = `REG-MANUAL-${user._id.toString()}-${Date.now()}`;

    const regPayment = await RegistrationPayment.create({
      user: user._id,
      amount: config.amount,
      currency: config.currency,
      paymentMethod: data.paymentMethod,
      paymentMode: RegPaymentMode.MANUAL,
      paymentReference: data.paymentReference.trim(),
      paymentStatus: RegPaymentStatus.PENDING,
      verificationStatus: RegVerificationStatus.PENDING,
      paymentTimestamp: new Date(),
      proofImage: data.proofImage,
      senderNotes: data.notes,
      idempotencyKey,
    });

    user.registrationPaymentStatus = RegistrationPaymentStatus.PENDING;
    await user.save();

    await AuditLog.create({
      actor: user._id,
      action: AuditAction.USER_REGISTER,
      target: regPayment._id,
      targetModel: 'RegistrationPayment',
      description: `Manual registration payment submitted: ${data.paymentMethod}, Ref: ${data.paymentReference}. Amount: Rs. ${config.amount / 100}`,
    });

    return regPayment;
  }

  // ─── Mode B: Automated Payment Initiation ─────────────────────────────────────
  public static async initiateAutomatedPayment(
    userId: string,
    gateway: 'easypaisa' | 'jazzcash'
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.registrationPaymentStatus === RegistrationPaymentStatus.PAID) {
      throw new BadRequestError('Registration fee is already paid.');
    }

    const config = await SystemSettingService.getRegistrationFeeConfig();
    const merchantOrderId = `CHX-REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const idempotencyKey = `AUTO-REG-${user._id.toString()}-${merchantOrderId}`;

    const adapter = gateway === 'easypaisa' ? new EasypaisaAdapter() : new JazzcashAdapter();

    const initiation = await adapter.initiatePayment({
      merchantOrderId,
      amount: config.amount,
      currency: config.currency,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerName: user.name,
      description: `ChainX Registration Fee (Rs. ${config.amount / 100})`,
      callbackUrl: `/api/v1/registration-payments/callback/${gateway}`,
      returnUrl: `/register-payment?status=confirmed&orderId=${merchantOrderId}`,
    });

    // Create Payment Record (Transactions module)
    const payment = await Payment.create({
      user: user._id,
      gateway: gateway === 'easypaisa' ? PaymentGateway.EASYPAISA : PaymentGateway.JAZZCASH,
      mode: adapter.isSandbox ? PaymentMode.SANDBOX : PaymentMode.LIVE,
      status: PaymentStatus.INITIATED,
      amount: config.amount,
      currency: config.currency,
      merchantOrderId,
      gatewayTransactionId: initiation.gatewayTransactionId,
      gatewayResponse: initiation.gatewayData,
      idempotencyKey,
    });

    // Create RegistrationPayment Record
    const regPayment = await RegistrationPayment.create({
      user: user._id,
      amount: config.amount,
      currency: config.currency,
      paymentMethod: gateway,
      paymentMode: adapter.isSandbox ? RegPaymentMode.AUTOMATED_SANDBOX : RegPaymentMode.AUTOMATED_LIVE,
      paymentReference: initiation.gatewayTransactionId,
      paymentStatus: RegPaymentStatus.INITIATED,
      verificationStatus: RegVerificationStatus.PENDING,
      paymentTimestamp: new Date(),
      associatedPaymentRecord: payment._id,
      idempotencyKey,
    });

    return {
      initiation,
      paymentId: payment._id,
      registrationPaymentId: regPayment._id,
      amount: config.amount,
      formattedAmount: `Rs. ${(config.amount / 100).toLocaleString()}`,
    };
  }

  // ─── Mode B: Signed Callback Verification with Idempotency ────────────────────
  public static async handleAutomatedCallback(
    gateway: 'easypaisa' | 'jazzcash',
    headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>
  ) {
    const adapter = gateway === 'easypaisa' ? new EasypaisaAdapter() : new JazzcashAdapter();
    const verification = await adapter.verifyCallback(headers, payload);

    if (!verification.isValid) {
      throw new BadRequestError('Invalid payment callback signature or parameters.');
    }

    const { merchantOrderId, gatewayTransactionId, isSuccess } = verification;

    // Check callback idempotency
    const idempotencyKey = `CALLBACK-${gateway}-${merchantOrderId}`;
    const existingCallback = await IdempotencyRecord.findOne({ key: idempotencyKey });
    if (existingCallback) {
      return existingCallback.result;
    }

    const payment = await Payment.findOne({ merchantOrderId });
    if (!payment) {
      throw new NotFoundError('Associated payment record not found for this callback.');
    }

    const regPayment = await RegistrationPayment.findOne({
      associatedPaymentRecord: payment._id,
    });

    if (isSuccess) {
      payment.status = PaymentStatus.SUCCESS;
      payment.gatewayTransactionId = gatewayTransactionId;
      payment.callbackPayload = payload;
      payment.completedAt = new Date();
      await payment.save();

      if (regPayment) {
        regPayment.paymentStatus = RegPaymentStatus.SUCCESS;
        regPayment.verificationStatus = RegVerificationStatus.APPROVED;
        regPayment.paymentReference = gatewayTransactionId;
        await regPayment.save();
      }

      // Activate user account
      const user = await User.findById(payment.user);
      if (user) {
        user.registrationPaymentStatus = RegistrationPaymentStatus.PAID;
        user.registrationPaidAt = new Date();
        user.accountStatus = AccountStatus.ACTIVE;
        user.isActive = true;
        await user.save();

        // Activate referral node
        const referral = await Referral.findOne({ referee: user._id });
        if (referral) {
          referral.status = ReferralStatus.ACTIVE;
          referral.activatedAt = new Date();
          await referral.save();
        }

        await AuditLog.create({
          actor: user._id,
          action: AuditAction.REGISTRATION_PAYMENT_APPROVED,
          target: payment._id,
          targetModel: 'Payment',
          description: `Automated registration payment confirmed via ${gateway} sandbox. Account activated. Ref: ${gatewayTransactionId}`,
        });
      }

      const result = { success: true, message: 'Payment verified and account activated successfully.' };

      // Record idempotency
      await IdempotencyRecord.create({
        key: idempotencyKey,
        operation: 'automated_payment_callback',
        result,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      return result;
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = verification.responseMessage;
      payment.callbackPayload = payload;
      await payment.save();

      if (regPayment) {
        regPayment.paymentStatus = RegPaymentStatus.FAILED;
        regPayment.rejectionReason = verification.responseMessage;
        await regPayment.save();
      }

      return { success: false, message: 'Payment processing failed or was cancelled.' };
    }
  }

  // ─── Admin Mode A: Approve Manual Payment ─────────────────────────────────────
  public static async adminApprovePayment(
    paymentId: string,
    adminId: string,
    internalNotes?: string
  ): Promise<IRegistrationPaymentDocument> {
    const regPayment = await RegistrationPayment.findById(paymentId);
    if (!regPayment) {
      throw new NotFoundError('Registration payment record not found.');
    }

    if (regPayment.verificationStatus === RegVerificationStatus.APPROVED) {
      throw new BadRequestError('This payment has already been approved and processed.');
    }

    regPayment.verificationStatus = RegVerificationStatus.APPROVED;
    regPayment.paymentStatus = RegPaymentStatus.SUCCESS;
    regPayment.reviewedBy = new mongoose.Types.ObjectId(adminId);
    regPayment.reviewedAt = new Date();
    if (internalNotes) {
      regPayment.adminNotes = internalNotes.trim();
    }
    await regPayment.save();

    // Activate user
    const user = await User.findById(regPayment.user);
    if (user) {
      user.registrationPaymentStatus = RegistrationPaymentStatus.PAID;
      user.registrationPaidAt = new Date();
      user.accountStatus = AccountStatus.ACTIVE;
      user.isActive = true;
      await user.save();

      // Activate referral node
      const referral = await Referral.findOne({ referee: user._id });
      if (referral) {
        referral.status = ReferralStatus.ACTIVE;
        referral.activatedAt = new Date();
        await referral.save();
      }

      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(adminId),
        action: AuditAction.REGISTRATION_PAYMENT_APPROVED,
        target: regPayment._id,
        targetModel: 'RegistrationPayment',
        description: `Manual registration payment approved by admin. User: ${user.email}, Ref: ${regPayment.paymentReference}. Notes: ${internalNotes || 'None'}`,
      });
    }

    return regPayment;
  }

  // ─── Admin Mode A: Reject Manual Payment ──────────────────────────────────────
  public static async adminRejectPayment(
    paymentId: string,
    adminId: string,
    reason: string,
    internalNotes?: string
  ): Promise<IRegistrationPaymentDocument> {
    const regPayment = await RegistrationPayment.findById(paymentId);
    if (!regPayment) {
      throw new NotFoundError('Registration payment record not found.');
    }

    if (regPayment.verificationStatus === RegVerificationStatus.APPROVED) {
      throw new BadRequestError('Cannot reject an already approved payment.');
    }

    regPayment.verificationStatus = RegVerificationStatus.REJECTED;
    regPayment.paymentStatus = RegPaymentStatus.REJECTED;
    regPayment.rejectionReason = reason.trim();
    regPayment.reviewedBy = new mongoose.Types.ObjectId(adminId);
    regPayment.reviewedAt = new Date();
    if (internalNotes) {
      regPayment.adminNotes = internalNotes.trim();
    }
    await regPayment.save();

    const user = await User.findById(regPayment.user);
    if (user && user.registrationPaymentStatus !== RegistrationPaymentStatus.PAID) {
      user.registrationPaymentStatus = RegistrationPaymentStatus.UNPAID;
      await user.save();
    }

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.REGISTRATION_PAYMENT_REJECTED,
      target: regPayment._id,
      targetModel: 'RegistrationPayment',
      description: `Manual registration payment rejected by admin. Reason: ${reason}. Notes: ${internalNotes || 'None'}`,
    });

    return regPayment;
  }

  // ─── Admin: Query Registration Payments ────────────────────────────────────────
  public static async getRegistrationPaymentsAdmin(query: {
    page?: number;
    limit?: number;
    verificationStatus?: string;
    paymentMethod?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.verificationStatus) {
      filter.verificationStatus = query.verificationStatus;
    }
    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }
    if (query.search) {
      filter.paymentReference = { $regex: query.search.trim(), $options: 'i' };
    }

    const [payments, total] = await Promise.all([
      RegistrationPayment.find(filter)
        .populate('user', 'name email phone referralCode')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RegistrationPayment.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      payments,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // ─── User: Get User's Registration Payment Status ─────────────────────────────
  public static async getUserRegistrationStatus(userId: string) {
    const user = await User.findById(userId).select('name email phone referralCode accountStatus registrationPaymentStatus registrationPaidAt registrationFee').lean();
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const config = await SystemSettingService.getRegistrationFeeConfig();
    const payments = await RegistrationPayment.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      user,
      feeConfig: config,
      payments,
    };
  }
}
