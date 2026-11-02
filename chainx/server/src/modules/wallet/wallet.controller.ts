import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/index.js';
import { WalletService } from './wallet.service.js';

const adjustmentSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer (paisa).'),
  direction: z.enum(['credit', 'debit']),
  reason: z.string().min(5, 'Reason must be at least 5 characters.').max(300),
  reference: z.string().max(200).optional(),
});

export class WalletController {
  // ─── User ──────────────────────────────────────────────────────────────────
  static async getMyWallet(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const summary = await WalletService.getWalletSummary(authUser.userId);
    res.json({ success: true, data: summary });
  }

  static async getMyTransactions(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { page, limit, type, direction, startDate, endDate } = req.query;
    const result = await WalletService.getTransactionHistory({
      userId: authUser.userId,
      page: Number(page || 1),
      limit: Number(limit || 20),
      ...(type ? { type: String(type) } : {}),
      ...(direction ? { direction: String(direction) } : {}),
      ...(startDate ? { startDate: String(startDate) } : {}),
      ...(endDate ? { endDate: String(endDate) } : {}),
    });
    res.json({ success: true, ...result });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  static async getWalletsAdmin(req: Request, res: Response) {
    const { page, limit, search } = req.query;
    const result = await WalletService.getWalletsAdmin({
      page: Number(page || 1),
      limit: Number(limit || 20),
      ...(search ? { search: String(search) } : {}),
    });
    res.json({ success: true, ...result });
  }

  static async getUserWallet(req: Request, res: Response) {
    const { userId } = req.params;
    const summary = await WalletService.getWalletSummary(userId);
    res.json({ success: true, data: summary });
  }

  static async getAdminLedger(req: Request, res: Response) {
    const { page, limit, type, direction, userId, startDate, endDate } = req.query;
    const result = await WalletService.getAdminLedger({
      page: Number(page || 1),
      limit: Number(limit || 20),
      ...(type ? { type: String(type) } : {}),
      ...(direction ? { direction: String(direction) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(startDate ? { startDate: String(startDate) } : {}),
      ...(endDate ? { endDate: String(endDate) } : {}),
    });
    res.json({ success: true, ...result });
  }

  static async getFinancialSummary(req: Request, res: Response) {
    const { startDate, endDate } = req.query;
    const result = await WalletService.getFinancialSummary({
      ...(startDate ? { startDate: String(startDate) } : {}),
      ...(endDate ? { endDate: String(endDate) } : {}),
    });
    res.json({ success: true, data: result });
  }

  static async adminAdjustment(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { userId } = req.params;
    const body = adjustmentSchema.parse(req.body);
    const tx = await WalletService.adminAdjustment({
      userId,
      adminId: authUser.userId,
      amount: body.amount,
      direction: body.direction,
      reason: body.reason,
      ...(body.reference ? { reference: body.reference } : {}),
    });
    res.status(201).json({
      success: true,
      message: `Wallet ${body.direction} adjustment of Rs. ${body.amount / 100} applied.`,
      data: tx,
    });
  }
}
