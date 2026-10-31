import { apiClient } from '@lib/axios';
import type { PaginationMeta } from '../products/product.api';

export interface RegistrationFeeConfig {
  amount: number; // in paisa
  currency: string;
  easypaisa: {
    accountTitle: string;
    accountNumber: string;
    instructions: string;
  };
  jazzcash: {
    accountTitle: string;
    accountNumber: string;
    instructions: string;
  };
  bankTransfer: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  crypto: {
    network: string;
    currency: string;
    amount: number;
    walletAddress: string;
  };
  automatedSandboxEnabled: boolean;
  manualEnabled: boolean;
}

export interface RegistrationPaymentRecord {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
  };
  amount: number;
  currency: string;
  paymentMethod: 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'manual' | 'crypto';
  paymentMode: 'manual' | 'automated_sandbox' | 'automated_live';
  paymentReference: string;
  paymentStatus: 'initiated' | 'pending' | 'success' | 'failed' | 'rejected';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  paymentTimestamp: string;
  proofImage?: string | undefined;
  senderNotes?: string | undefined;
  adminNotes?: string | undefined;
  rejectionReason?: string | undefined;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  } | undefined;
  reviewedAt?: string | undefined;
  createdAt: string;
}

export const registrationPaymentApi = {
  getConfig: async () => {
    const res = await apiClient.get<{ success: boolean; data: RegistrationFeeConfig }>(
      '/registration-payments/config'
    );
    return res.data.data;
  },

  getUserStatus: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        user: {
          name: string;
          email: string;
          referralCode: string;
          accountStatus: string;
          registrationPaymentStatus: string;
        };
        feeConfig: RegistrationFeeConfig;
        payments: RegistrationPaymentRecord[];
      };
    }>('/registration-payments/status');
    return res.data.data;
  },

  submitManual: async (data: {
    paymentMethod: 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'manual' | 'crypto';
    paymentReference: string;
    proofImage?: string | undefined;
    notes?: string | undefined;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: RegistrationPaymentRecord }>(
      '/registration-payments/manual',
      data
    );
    return res.data.data;
  },

  initiateAutomated: async (gateway: 'easypaisa' | 'jazzcash') => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        initiation: {
          merchantOrderId: string;
          gatewayTransactionId: string;
          paymentUrl: string;
          gatewayData: Record<string, unknown>;
          expiresAt: string;
        };
        amount: number;
        formattedAmount: string;
      };
    }>('/registration-payments/initiate-automated', { gateway });
    return res.data.data;
  },

  triggerAutomatedCallback: async (gateway: 'easypaisa' | 'jazzcash', payload: Record<string, unknown>) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/registration-payments/callback/${gateway}`,
      payload
    );
    return res.data;
  },

  // ─── Admin Endpoints ────────────────────────────────────────────────────────
  adminGetPayments: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    verificationStatus?: string | undefined;
    paymentMethod?: string | undefined;
    search?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: RegistrationPaymentRecord[];
      meta: PaginationMeta;
    }>('/registration-payments/admin', { params });
    return res.data;
  },

  adminApprove: async (id: string, internalNotes?: string | undefined) => {
    const res = await apiClient.post<{ success: boolean; data: RegistrationPaymentRecord }>(
      `/registration-payments/admin/${id}/approve`,
      { internalNotes }
    );
    return res.data.data;
  },

  adminReject: async (id: string, reason: string, internalNotes?: string | undefined) => {
    const res = await apiClient.post<{ success: boolean; data: RegistrationPaymentRecord }>(
      `/registration-payments/admin/${id}/reject`,
      { reason, internalNotes }
    );
    return res.data.data;
  },

  adminUpdateConfig: async (config: Partial<RegistrationFeeConfig>) => {
    const res = await apiClient.put<{ success: boolean; data: RegistrationFeeConfig }>(
      '/registration-payments/admin/config',
      config
    );
    return res.data.data;
  },
};
