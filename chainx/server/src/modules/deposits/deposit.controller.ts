import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/index.js';
import { DepositService } from './deposit.service.js';

const submitDepositSchema = z.object({
  amount: z
    .number()
    .int('Amount must be whole paisa.')
    .positive('Amount must be positive.'),
  paymentMethod: z.enum(['easypaisa', 'jazzcash']),
  paymentReference: z.string().min(1, 'Transaction reference is required.').max(100),
  proofImageUrl: z.string().url('Invalid proof image URL.').optional(),
  senderNotes: z.string().max(300).optional(),
});

const reviewSchema = z.object({
  adminNotes: z.string().max(500).optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters.').max(300),
  adminNotes: z.string().max(500).optional(),
});

export class DepositController {
  // ─── User ──────────────────────────────────────────────────────────────────
  static async submitDeposit(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const body = submitDepositSchema.parse(req.body);
    const deposit = await DepositService.submitManualDeposit({
      userId: authUser.userId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
      ...(body.proofImageUrl ? { proofImageUrl: body.proofImageUrl } : {}),
      ...(body.senderNotes ? { senderNotes: body.senderNotes } : {}),
    });
    res.status(201).json({
      success: true,
      message: 'Deposit request submitted. It will be reviewed by admin shortly.',
      data: deposit,
    });
  }

  static async getMyDeposits(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { page, limit, status } = req.query;
    const result = await DepositService.getUserDeposits({
      userId: authUser.userId,
      page: Number(page || 1),
      limit: Number(limit || 10),
      ...(status ? { status: String(status) } : {}),
    });
    res.json({ success: true, ...result });
  }

  static async getPaymentInstructions(_req: Request, res: Response) {
    const instructions = await DepositService.getPaymentInstructions();
    res.json({ success: true, data: instructions });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  static async getDepositsAdmin(req: Request, res: Response) {
    const { page, limit, status, paymentMethod, userId, search, startDate, endDate } = req.query;
    const result = await DepositService.getDepositsAdmin({
      page: Number(page || 1),
      limit: Number(limit || 20),
      ...(status ? { status: String(status) } : {}),
      ...(paymentMethod ? { paymentMethod: String(paymentMethod) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(search ? { search: String(search) } : {}),
      ...(startDate ? { startDate: String(startDate) } : {}),
      ...(endDate ? { endDate: String(endDate) } : {}),
    });
    res.json({ success: true, ...result });
  }

  static async approveDeposit(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { depositId } = req.params;
    const body = reviewSchema.parse(req.body);
    const deposit = await DepositService.adminApproveDeposit({
      depositId,
      adminId: authUser.userId,
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    });
    res.json({
      success: true,
      message: `Deposit of Rs. ${deposit.amount / 100} approved and credited to user wallet.`,
      data: deposit,
    });
  }

  static async rejectDeposit(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { depositId } = req.params;
    const body = rejectSchema.parse(req.body);
    const deposit = await DepositService.adminRejectDeposit({
      depositId,
      adminId: authUser.userId,
      reason: body.reason,
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    });
    res.json({
      success: true,
      message: 'Deposit rejected.',
      data: deposit,
    });
  }
}
