import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { ReferralService } from './referral.service.js';
import { SystemSettingService } from '../admin/systemSetting.service.js';
import { sendSuccess } from '../../common/response.js';
import { BadRequestError } from '../../common/errors.js';
import type { RefundPayoutMethod } from './registrationRefund.model.js';

export class ReferralController {
  // ─── User Endpoints ─────────────────────────────────────────────────────────
  public static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser) {
        throw new BadRequestError('User authentication required.');
      }
      const data = await ReferralService.getUserReferralDashboard(authUser.userId);
      sendSuccess(res, data, 'Referral dashboard data retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async requestFeeRefund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser) {
        throw new BadRequestError('User authentication required.');
      }
      const { payoutMethod, payoutDetails } = req.body as {
        payoutMethod?: RefundPayoutMethod;
        payoutDetails?: {
          accountTitle?: string;
          accountNumber?: string;
          bankName?: string;
          iban?: string;
        };
      };

      if (!payoutMethod) {
        throw new BadRequestError('Payout method is required.');
      }

      const refund = await ReferralService.requestRegistrationFeeRefund(
        authUser.userId,
        payoutMethod,
        payoutDetails
      );
      sendSuccess(res, refund, 'Registration fee refund request submitted successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin Endpoints ────────────────────────────────────────────────────────
  public static async adminGetReferrals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const search = req.query['search'] as string | undefined;
      const status = req.query['status'] as string | undefined;
      const referrerId = req.query['referrerId'] as string | undefined;

      const result = await ReferralService.adminGetReferrals({
        page,
        limit,
        search,
        status,
        referrerId,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Referrals retrieved successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adminReverseReferral(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser) {
        throw new BadRequestError('Admin authentication required.');
      }
      const referralId = req.params['id'];
      if (!referralId) {
        throw new BadRequestError('Referral ID is required.');
      }
      const { reason } = req.body as { reason?: string };
      if (!reason || !reason.trim()) {
        throw new BadRequestError('Reversal reason is required.');
      }

      const updated = await ReferralService.adminReverseReferral(
        referralId,
        authUser.userId,
        reason.trim()
      );
      sendSuccess(res, updated, 'Referral reversed successfully and ledger adjusted.');
    } catch (error) {
      next(error);
    }
  }

  public static async adminGetMilestones(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;

      const result = await ReferralService.adminGetMilestones({ page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Milestone achievements retrieved successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adminGetRefunds(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const status = req.query['status'] as string | undefined;

      const result = await ReferralService.adminGetRefunds({ page, limit, status });
      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Registration refunds retrieved successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adminProcessRefund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser) {
        throw new BadRequestError('Admin authentication required.');
      }
      const refundId = req.params['id'];
      if (!refundId) {
        throw new BadRequestError('Refund ID is required.');
      }
      const { action, notes, transactionReference } = req.body as {
        action: 'approve' | 'reject' | 'complete';
        notes?: string;
        transactionReference?: string;
      };

      if (!action || !['approve', 'reject', 'complete'].includes(action)) {
        throw new BadRequestError('Valid action (approve, reject, complete) is required.');
      }

      const updated = await ReferralService.adminProcessRefund(
        refundId,
        authUser.userId,
        action,
        notes,
        transactionReference
      );
      sendSuccess(res, updated, `Refund claim ${action}d successfully.`);
    } catch (error) {
      next(error);
    }
  }

  public static async adminGetPolicy(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const policy = await SystemSettingService.getReferralCommissionPolicy();
      sendSuccess(res, policy, 'Referral commission policy retrieved.');
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdatePolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser) {
        throw new BadRequestError('Admin authentication required.');
      }
      const updated = await SystemSettingService.updateReferralCommissionPolicy(
        req.body,
        authUser.userId
      );
      sendSuccess(res, updated, 'Referral commission policy updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
