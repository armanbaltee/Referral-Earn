import type { Request, Response } from 'express';
import { AdminOverviewService } from './admin.overview.service.js';
import { AdminReportsService } from './admin.reports.service.js';
import { SystemSettingService } from './systemSetting.service.js';
import { AuditLog } from './auditLog.model.js';
import { Referral } from '../referrals/referral.model.js';
import type { AuthenticatedRequest } from '../../types/index.js';

export class AdminController {
  // ─── 1. Dashboard Overview ────────────────────────────────────────────────
  public static async getDashboardOverview(_req: Request, res: Response): Promise<void> {
    const data = await AdminOverviewService.getDashboardMetrics();
    res.json({ success: true, data });
  }

  // ─── 2. Audit Logs ────────────────────────────────────────────────────────
  public static async getAuditLogs(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const action = req.query.action as string | undefined;
    const search = req.query.search as string | undefined;

    const filter: Record<string, unknown> = {};
    if (action && action !== 'all') {
      filter.action = action;
    }
    if (search) {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  }

  // ─── 3. Platform Settings ─────────────────────────────────────────────────
  public static async getPlatformSettings(_req: Request, res: Response): Promise<void> {
    const [registrationFee, referralPolicy, general] = await Promise.all([
      SystemSettingService.getRegistrationFeeConfig(),
      SystemSettingService.getReferralCommissionPolicy(),
      SystemSettingService.getPlatformGeneralConfig(),
    ]);

    res.json({
      success: true,
      data: {
        registrationFee,
        referralPolicy,
        general,
      },
    });
  }

  public static async updateRegistrationFeeConfig(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const updated = await SystemSettingService.updateRegistrationFeeConfig(req.body, adminId);
    res.json({ success: true, message: 'Registration fee configuration updated.', data: updated });
  }

  public static async updateReferralPolicy(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const updated = await SystemSettingService.updateReferralCommissionPolicy(req.body, adminId);
    res.json({ success: true, message: `Referral compensation policy updated to v${updated.policyVersion}.`, data: updated });
  }

  public static async updateGeneralConfig(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const updated = await SystemSettingService.updatePlatformGeneralConfig(req.body, adminId);
    res.json({ success: true, message: 'Platform general settings updated.', data: updated });
  }

  // ─── 4. CSV Reports Export ────────────────────────────────────────────────
  public static async exportReport(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const { filename, csv } = await AdminReportsService.generateCsvReport(
      type || 'ledger',
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // ─── 5. Suspicious Referrals Detection ────────────────────────────────────
  public static async getSuspiciousReferrals(_req: Request, res: Response): Promise<void> {
    // Detect referrers with referrals registered within short time windows or with high reversal rates
    const suspiciousReferrals = await Referral.aggregate([
      {
        $group: {
          _id: '$referrer',
          totalReferred: { $sum: 1 },
          reversedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] },
          },
          lastReferredAt: { $max: '$createdAt' },
        },
      },
      {
        $match: {
          $or: [{ reversedCount: { $gte: 2 } }, { totalReferred: { $gte: 25 } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'referrerUser',
        },
      },
      { $unwind: '$referrerUser' },
      { $sort: { reversedCount: -1, totalReferred: -1 } },
      { $limit: 20 },
    ]);

    res.json({ success: true, data: suspiciousReferrals });
  }
}

