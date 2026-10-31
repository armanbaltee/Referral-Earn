import type { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../common/response.js';
import { RegistrationPaymentService } from './registrationPayment.service.js';
import { SystemSettingService } from '../admin/systemSetting.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';

export class RegistrationPaymentController {
  public static async getConfig(_req: Request, res: Response): Promise<void> {
    const config = await SystemSettingService.getRegistrationFeeConfig();
    sendSuccess(res, config, 'Registration fee configuration retrieved.');
  }

  public static async getUserStatus(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const status = await RegistrationPaymentService.getUserRegistrationStatus(userId);
    sendSuccess(res, status, 'User registration payment status retrieved.');
  }

  public static async submitManual(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const { paymentMethod, paymentReference, proofImage, notes } = req.body;
    const payment = await RegistrationPaymentService.submitManualPayment(userId, {
      paymentMethod,
      paymentReference,
      proofImage,
      notes,
    });
    sendSuccess(res, payment, 'Registration payment request submitted. Awaiting verification.');
  }

  public static async initiateAutomated(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const { gateway } = req.body;
    const result = await RegistrationPaymentService.initiateAutomatedPayment(userId, gateway);
    sendSuccess(res, result, 'Automated payment initiated.');
  }

  public static async handleCallback(req: Request, res: Response): Promise<void> {
    const { gateway } = req.params;
    const result = await RegistrationPaymentService.handleAutomatedCallback(
      gateway as 'easypaisa' | 'jazzcash',
      req.headers as Record<string, string | string[] | undefined>,
      req.body
    );
    sendSuccess(res, result, 'Callback processed.');
  }

  // ─── Admin Endpoints ──────────────────────────────────────────────────────────
  public static async adminGetPayments(req: Request, res: Response): Promise<void> {
    const result = await RegistrationPaymentService.getRegistrationPaymentsAdmin(req.query);
    sendPaginated(res, result.payments, result.meta, 'Registration payments retrieved.');
  }

  public static async adminApprove(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const { internalNotes } = req.body;
    const payment = await RegistrationPaymentService.adminApprovePayment(
      id as string,
      adminId,
      internalNotes
    );
    sendSuccess(res, payment, 'Registration payment approved and account activated.');
  }

  public static async adminReject(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const { reason, internalNotes } = req.body;
    const payment = await RegistrationPaymentService.adminRejectPayment(
      id as string,
      adminId,
      reason,
      internalNotes
    );
    sendSuccess(res, payment, 'Registration payment rejected.');
  }

  public static async adminUpdateConfig(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const updated = await SystemSettingService.updateRegistrationFeeConfig(req.body, adminId);
    sendSuccess(res, updated, 'Registration fee settings updated successfully.');
  }
}
