import { apiClient } from '@lib/axios';
import type {
  RegisterFormData,
  LoginFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  VerifyEmailFormData,
} from './auth.types';
import type { AuthUser, AccountStatus, RegistrationPaymentStatus } from '@store/auth.store';

export type { AuthUser, AccountStatus, RegistrationPaymentStatus };

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  accountStatus: AccountStatus;
  registrationPaymentStatus: RegistrationPaymentStatus;
}

export interface RegisterResponse {
  user: AuthUser;
  verificationToken: string;
  registrationFee: number;
  redirectUrl: string;
}

export const authApi = {
  register: async (data: RegisterFormData): Promise<{ data: RegisterResponse; message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: RegisterResponse; message: string }>(
      '/auth/register',
      data
    );
    return res.data;
  },

  login: async (data: LoginFormData): Promise<{ data: LoginResponse; message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse; message: string }>(
      '/auth/login',
      data
    );
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { accessToken: string } }>(
      '/auth/refresh'
    );
    return res.data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await apiClient.get<{ success: boolean; data: AuthUser }>('/auth/me');
    return res.data.data;
  },

  forgotPassword: async (data: ForgotPasswordFormData): Promise<{ message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/forgot-password',
      data
    );
    return res.data;
  },

  resetPassword: async (data: ResetPasswordFormData): Promise<{ message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      data
    );
    return res.data;
  },

  verifyEmail: async (data: VerifyEmailFormData): Promise<{ user: AuthUser; message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: AuthUser; message: string }>(
      '/auth/verify-email',
      data
    );
    return { user: res.data.data, message: res.data.message };
  },

  submitRegistrationPayment: async (data: {
    paymentMethod: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'manual';
    paymentReference: string;
    proofImage?: string | undefined;
    notes?: string | undefined;
  }): Promise<{ user: AuthUser; message: string }> => {
    const res = await apiClient.post<{ success: boolean; data: AuthUser; message: string }>(
      '/auth/registration-payment',
      data
    );
    return { user: res.data.data, message: res.data.message };
  },
};

