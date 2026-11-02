import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/index.js';
import { WithdrawalService } from './withdrawal.service.js';

const submitWithdrawalSchema = z.object({
  amount: z.number().int('Amount must be whole paisa.').positive('Amount must be positive.'),
  paymentMethod: z.enum(['easypaisa', 'jazzcash']),
  accountTitle: z.string().min(2, 'Account holder name is required.').max(100).trim(),
  accountNumber: z.string().regex(/^03\d{9}$/, 'Enter a valid Pakistani mobile number (03XXXXXXXXX).'),
});

const approveSchema = z.object({
  adminNotes: z.string().max(500).optional(),
});

const completeSchema = z.object({
  gatewayTransactionId: z.string().max(200).optional(),
  adminNotes: z.string().max(500).optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters.').max(300),
  adminNotes: z.string().max(500).optional(),
});

const failSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters.').max(300),
});

export class WithdrawalController {
  // ─── User ──────────────────────────────────────────────────────────────────
  static async submitWithdrawal(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const body = submitWithdrawalSchema.parse(req.body);
    const withdrawal = await WithdrawalService.submitWithdrawal({
      userId: authUser.userId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      accountTitle: body.accountTitle,
      accountNumber: body.accountNumber,
    });
    res.status(201).json({
      success: true,
      message: `Withdrawal request of Rs. ${body.amount / 100} submitted. Funds are reserved pending admin review.`,
      data: withdrawal,
    });
  }

  static async getMyWithdrawals(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { page, limit, status } = req.query;
    const result = await WithdrawalService.getUserWithdrawals({
      userId: authUser.userId,
      page: Number(page || 1),
      limit: Number(limit || 10),
      ...(status ? { status: String(status) } : {}),
    });
    res.json({ success: true, ...result });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  static async getWithdrawalsAdmin(req: Request, res: Response) {
    const { page, limit, status, paymentMethod, userId, startDate, endDate } = req.query;
    const result = await WithdrawalService.getWithdrawalsAdmin({
      page: Number(page || 1),
      limit: Number(limit || 20),
      ...(status ? { status: String(status) } : {}),
      ...(paymentMethod ? { paymentMethod: String(paymentMethod) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(startDate ? { startDate: String(startDate) } : {}),
      ...(endDate ? { endDate: String(endDate) } : {}),
    });
    res.json({ success: true, ...result });
  }

  static async approveWithdrawal(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { withdrawalId } = req.params;
    const body = approveSchema.parse(req.body);
    const withdrawal = await WithdrawalService.adminApproveWithdrawal({
      withdrawalId,
      adminId: authUser.userId,
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    });
    res.json({
      success: true,
      message: 'Withdrawal approved. Proceed to complete payout after sending payment.',
      data: withdrawal,
    });
  }

  static async completeWithdrawal(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { withdrawalId } = req.params;
    const body = completeSchema.parse(req.body);
    const withdrawal = await WithdrawalService.adminCompleteWithdrawal({
      withdrawalId,
      adminId: authUser.userId,
      ...(body.gatewayTransactionId ? { gatewayTransactionId: body.gatewayTransactionId } : {}),
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    });
    res.json({
      success: true,
      message: 'Withdrawal marked as completed. Ledger finalized.',
      data: withdrawal,
    });
  }

  static async rejectWithdrawal(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { withdrawalId } = req.params;
    const body = rejectSchema.parse(req.body);
    const withdrawal = await WithdrawalService.adminRejectWithdrawal({
      withdrawalId,
      adminId: authUser.userId,
      reason: body.reason,
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    });
    res.json({
      success: true,
      message: 'Withdrawal rejected. Reserved funds have been returned to user wallet.',
      data: withdrawal,
    });
  }

  static async failWithdrawal(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { withdrawalId } = req.params;
    const body = failSchema.parse(req.body);
    const withdrawal = await WithdrawalService.adminFailWithdrawal({
      withdrawalId,
      adminId: authUser.userId,
      reason: body.reason,
    });
    res.json({
      success: true,
      message: 'Withdrawal marked as failed. Reserved funds released.',
      data: withdrawal,
    });
  }
}
