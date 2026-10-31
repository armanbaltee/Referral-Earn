import type { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../common/response.js';
import { env } from '../../config/env.js';
import { UserService } from './user.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class UserController {
  public static async register(req: Request, res: Response): Promise<void> {
    const result = await UserService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    sendSuccess(
      res,
      {
        user: result.user,
        verificationToken: result.verificationToken,
        registrationFee: result.registrationFee,
        redirectUrl: result.redirectUrl,
      },
      'Account created successfully. Please complete the registration payment to activate your account.',
      201
    );
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const { user, accessToken, refreshToken } = await UserService.login(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    sendSuccess(
      res,
      {
        user,
        accessToken,
        accountStatus: user.accountStatus,
        registrationPaymentStatus: user.registrationPaymentStatus,
      },
      'Signed in successfully.'
    );
  }

  public static async refresh(req: Request, res: Response): Promise<void> {
    const token = (req.cookies?.refreshToken as string) || req.body?.refreshToken;

    const { accessToken, refreshToken } = await UserService.rotateRefreshToken(
      token,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    sendSuccess(res, { accessToken }, 'Access token refreshed.');
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    const token = (req.cookies?.refreshToken as string) || req.body?.refreshToken;
    const userId = (req as Partial<AuthenticatedRequest>).user?.userId;

    await UserService.logout(token, userId);

    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

    sendSuccess(res, null, 'Signed out successfully.');
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const user = await UserService.getUserDetailsAdmin(userId);
    sendSuccess(res, user, 'Profile retrieved.');
  }

  public static async getSessions(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const sessions = await UserService.getUserSessions(userId);
    sendSuccess(res, sessions, 'Active sessions retrieved.');
  }

  public static async revokeSession(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const { sessionId } = req.params;
    await UserService.revokeSession(userId, sessionId as string);
    sendSuccess(res, null, 'Session revoked.');
  }

  public static async revokeAllSessions(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    await UserService.revokeAllSessions(userId);
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    sendSuccess(res, null, 'All sessions revoked.');
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const result = await UserService.forgotPassword(req.body.email);
    sendSuccess(res, result, result.message);
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    await UserService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password has been reset successfully. Please sign in with your new password.');
  }

  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    const user = await UserService.verifyEmail(req.body.token);
    sendSuccess(
      res,
      user,
      user.accountStatus === 'active'
        ? 'Email verified. Your account is active!'
        : 'Email verified. Please complete your registration fee payment to activate your account.'
    );
  }

  public static async submitRegistrationPayment(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user?.userId || req.body.userId;
    const { paymentMethod, paymentReference, proofImage, notes } = req.body;
    const user = await UserService.submitRegistrationPayment(
      userId,
      paymentMethod,
      paymentReference,
      proofImage,
      notes
    );
    sendSuccess(
      res,
      user,
      'Registration payment submitted successfully. Your account will be activated once verified by our team.'
    );
  }

  // ─── Admin Controller Methods ────────────────────────────────────────────────
  public static async adminGetUsers(req: Request, res: Response): Promise<void> {
    const result = await UserService.getUsersAdmin(req.query as never);
    sendPaginated(res, result.users, result.meta, 'Users retrieved successfully.');
  }

  public static async adminGetUserDetails(req: Request, res: Response): Promise<void> {
    const user = await UserService.getUserDetailsAdmin(req.params.id as string);
    sendSuccess(res, user, 'User details retrieved.');
  }

  public static async adminSuspendUser(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const user = await UserService.suspendUser(adminId, req.params.id as string, req.body.reason);
    sendSuccess(res, user, 'User suspended successfully.');
  }

  public static async adminReactivateUser(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const user = await UserService.reactivateUser(adminId, req.params.id as string);
    sendSuccess(res, user, 'User reactivated successfully.');
  }

  public static async adminConfirmPayment(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const user = await UserService.confirmRegistrationPayment(
      req.params.id as string,
      adminId,
      req.body.transactionId,
      req.body.notes
    );
    sendSuccess(res, user, 'Registration fee marked as paid and account activated.');
  }
}
