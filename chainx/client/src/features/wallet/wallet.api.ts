import api from '@/lib/axios';

export interface WalletSummary {
  availableBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalEarned: number;
  breakdown: {
    taskEarnings: number;
    referralCommissions: number;
    referralBonuses: number;
    refundCredits: number;
  };
}

export interface WalletTransactionItem {
  _id: string;
  type: string;
  direction: 'credit' | 'debit';
  status: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  idempotencyKey: string;
  sourceReference?: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string };
  processedBy?: { _id: string; name: string; email: string };
}

export interface DepositItem {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod: 'easypaisa' | 'jazzcash';
  status: string;
  paymentReference: string;
  proofImageUrl?: string;
  senderNotes?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string; phone: string; referralCode: string };
  reviewedBy?: { _id: string; name: string; email: string };
}

export interface WithdrawalItem {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod: 'easypaisa' | 'jazzcash';
  accountTitle: string;
  accountNumber: string;
  status: string;
  rejectionReason?: string;
  adminNotes?: string;
  gatewayTransactionId?: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string; phone: string; referralCode: string };
  reviewedBy?: { _id: string; name: string; email: string };
  processedBy?: { _id: string; name: string; email: string };
}

export interface PaymentInstructions {
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
  minDeposit: number;
  maxDeposit: number;
}

export const walletApi = {
  // User wallet
  getMyWallet: async () => {
    const res = await api.get<{ success: boolean; data: WalletSummary }>('/api/v1/wallet/me');
    return res.data.data;
  },

  getMyTransactions: async (params?: { page?: number | undefined; limit?: number | undefined; type?: string | undefined; direction?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      transactions: WalletTransactionItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/wallet/me/transactions', { params });
    return res.data;
  },

  // Deposits
  getPaymentInstructions: async () => {
    const res = await api.get<{ success: boolean; data: PaymentInstructions }>('/api/v1/deposits/instructions');
    return res.data.data;
  },

  submitDeposit: async (data: {
    amount: number;
    paymentMethod: 'easypaisa' | 'jazzcash';
    paymentReference: string;
    proofImageUrl?: string | undefined;
    senderNotes?: string | undefined;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: DepositItem }>('/api/v1/deposits', data);
    return res.data;
  },

  getMyDeposits: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      deposits: DepositItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/deposits/me', { params });
    return res.data;
  },

  // Withdrawals
  submitWithdrawal: async (data: {
    amount: number;
    paymentMethod: 'easypaisa' | 'jazzcash';
    accountTitle: string;
    accountNumber: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: WithdrawalItem }>('/api/v1/withdrawals', data);
    return res.data;
  },

  getMyWithdrawals: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      withdrawals: WithdrawalItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/withdrawals/me', { params });
    return res.data;
  },

  // Admin APIs
  getWalletsAdmin: async (params?: { page?: number | undefined; limit?: number | undefined; search?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      wallets: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/wallet/admin', { params });
    return res.data;
  },

  getAdminLedger: async (params?: { page?: number | undefined; limit?: number | undefined; type?: string | undefined; direction?: string | undefined; userId?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      transactions: WalletTransactionItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/wallet/admin/ledger', { params });
    return res.data;
  },

  getFinancialSummary: async (params?: { startDate?: string | undefined; endDate?: string | undefined } | undefined) => {
    const res = await api.get<{ success: boolean; data: any }>('/api/v1/wallet/admin/summary', { params });
    return res.data.data;
  },

  adminAdjustment: async (userId: string, data: { amount: number; direction: 'credit' | 'debit'; reason: string; reference?: string | undefined }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/api/v1/wallet/admin/user/${userId}/adjust`, data);
    return res.data;
  },

  getDepositsAdmin: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined; paymentMethod?: string | undefined; search?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      deposits: DepositItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/deposits/admin', { params });
    return res.data;
  },

  approveDeposit: async (depositId: string, data?: { adminNotes?: string | undefined } | undefined) => {
    const res = await api.patch<{ success: boolean; message: string; data: DepositItem }>(`/api/v1/deposits/admin/${depositId}/approve`, data || {});
    return res.data;
  },

  rejectDeposit: async (depositId: string, data: { reason: string; adminNotes?: string | undefined }) => {
    const res = await api.patch<{ success: boolean; message: string; data: DepositItem }>(`/api/v1/deposits/admin/${depositId}/reject`, data);
    return res.data;
  },

  getWithdrawalsAdmin: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined; paymentMethod?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      withdrawals: WithdrawalItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/withdrawals/admin', { params });
    return res.data;
  },

  approveWithdrawal: async (withdrawalId: string, data?: { adminNotes?: string | undefined } | undefined) => {
    const res = await api.patch<{ success: boolean; message: string; data: WithdrawalItem }>(`/api/v1/withdrawals/admin/${withdrawalId}/approve`, data || {});
    return res.data;
  },

  completeWithdrawal: async (withdrawalId: string, data?: { gatewayTransactionId?: string | undefined; adminNotes?: string | undefined } | undefined) => {
    const res = await api.patch<{ success: boolean; message: string; data: WithdrawalItem }>(`/api/v1/withdrawals/admin/${withdrawalId}/complete`, data || {});
    return res.data;
  },

  rejectWithdrawal: async (withdrawalId: string, data: { reason: string; adminNotes?: string | undefined }) => {
    const res = await api.patch<{ success: boolean; message: string; data: WithdrawalItem }>(`/api/v1/withdrawals/admin/${withdrawalId}/reject`, data);
    return res.data;
  },

  failWithdrawal: async (withdrawalId: string, data: { reason: string }) => {
    const res = await api.patch<{ success: boolean; message: string; data: WithdrawalItem }>(`/api/v1/withdrawals/admin/${withdrawalId}/fail`, data);
    return res.data;
  },
};
