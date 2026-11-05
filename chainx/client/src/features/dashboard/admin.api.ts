import api from '@/lib/axios';

export interface AdminDashboardOverviewData {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    totalOrdersCount: number;
    totalProductSalesPaisa: number;
    verifiedRegistrationPaymentsPaisa: number;
    totalReferralCommissionsPaisa: number;
    totalMilestoneBonusesPaisa: number;
    pendingRefundsCount: number;
    pendingDepositsCount: number;
    pendingDepositsPaisa: number;
    approvedDepositsPaisa: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsPaisa: number;
    completedWithdrawalsPaisa: number;
    activeTasksCount: number;
    pendingTaskSubmissionsCount: number;
  };
  platformChart: Array<{
    month: string;
    deposits: number;
    withdrawals: number;
    commissions: number;
  }>;
  pendingActions: Array<{
    id: string;
    type: string;
    user: string;
    amount: string;
    method: string;
    time: string;
    link: string;
  }>;
  recentAuditLogs: Array<{
    _id: string;
    action: string;
    actor?: { name: string; email: string };
    description: string;
    createdAt: string;
  }>;
}

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  registrationPaymentStatus: string;
  referralCode: string;
  referredBy?: { _id: string; name: string; email: string; referralCode: string };
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  stats?: {
    directReferralsCount: number;
    activeSessionsCount: number;
  };
  auditHistory?: any[];
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPinned: boolean;
  image?: string | undefined;
  publishedAt?: string | undefined;
  expiresAt?: string | undefined;
  targetRoles: string[];
  createdAt: string;
  createdBy?: { name: string; email: string } | undefined;
}

export const adminApi = {
  // Overview
  getDashboardOverview: async () => {
    const res = await api.get<{ success: boolean; data: AdminDashboardOverviewData }>('/admin/dashboard/overview');
    return res.data.data;
  },

  // Users
  getUsers: async (params?: { page?: number | undefined; limit?: number | undefined; search?: string | undefined; role?: string | undefined; accountStatus?: string | undefined; registrationPaymentStatus?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      data: AdminUserItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/admin/users', { params });
    return res.data;
  },

  getUserDetails: async (id: string) => {
    const res = await api.get<{ success: boolean; data: AdminUserItem }>(`/admin/users/${id}`);
    return res.data.data;
  },

  suspendUser: async (id: string, reason: string) => {
    const res = await api.post<{ success: boolean; message: string; data: AdminUserItem }>(`/admin/users/${id}/suspend`, { reason });
    return res.data;
  },

  reactivateUser: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string; data: AdminUserItem }>(`/admin/users/${id}/reactivate`);
    return res.data;
  },

  confirmRegistrationPayment: async (id: string, data: { transactionId: string; notes?: string | undefined }) => {
    const res = await api.post<{ success: boolean; message: string; data: AdminUserItem }>(`/admin/users/${id}/confirm-payment`, data);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { page?: number | undefined; limit?: number | undefined; action?: string | undefined; search?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/admin/audit-logs', { params });
    return res.data;
  },

  // Platform Settings
  getSettings: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/admin/settings');
    return res.data.data;
  },

  updateRegistrationFeeConfig: async (data: any) => {
    const res = await api.put<{ success: boolean; message: string; data: any }>('/admin/settings/registration-fee', data);
    return res.data;
  },

  updateReferralPolicy: async (data: any) => {
    const res = await api.put<{ success: boolean; message: string; data: any }>('/admin/settings/referral-policy', data);
    return res.data;
  },

  updateGeneralConfig: async (data: any) => {
    const res = await api.put<{ success: boolean; message: string; data: any }>('/admin/settings/general', data);
    return res.data;
  },

  // Suspicious referrals
  getSuspiciousReferrals: async () => {
    const res = await api.get<{ success: boolean; data: any[] }>('/admin/referrals/suspicious');
    return res.data.data;
  },

  // Announcements
  getAnnouncementsAdmin: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      announcements: AnnouncementItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/announcements/admin/all', { params });
    return res.data;
  },

  createAnnouncement: async (data: Partial<AnnouncementItem>) => {
    const res = await api.post<{ success: boolean; message: string; data: AnnouncementItem }>('/announcements/admin', data);
    return res.data;
  },

  updateAnnouncement: async (id: string, data: Partial<AnnouncementItem>) => {
    const res = await api.put<{ success: boolean; message: string; data: AnnouncementItem }>(`/announcements/admin/${id}`, data);
    return res.data;
  },

  deleteAnnouncement: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/announcements/admin/${id}`);
    return res.data;
  },

  // Fee Refunds (10-referral milestone refunds)
  getRefundsAdmin: async (params?: { page?: number | undefined; limit?: number | undefined; status?: string | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/referrals/admin/refunds', { params });
    return res.data;
  },

  processRefund: async (id: string, data: { action: 'approve' | 'reject' | 'complete'; notes?: string | undefined; transactionReference?: string | undefined }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/referrals/admin/refunds/${id}/process`, data);
    return res.data;
  },
};
