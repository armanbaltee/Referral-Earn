import { apiClient } from '@lib/axios';
import type { PaginationMeta } from '../products/product.api';

export interface RefereeInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
  accountStatus: string;
  registrationPaymentStatus: string;
  createdAt: string;
}

export interface DirectReferralItem {
  _id: string;
  referee: RefereeInfo;
  status:
    | 'registered'
    | 'payment_pending'
    | 'payment_confirmed'
    | 'verification_pending'
    | 'eligible'
    | 'commission_processing'
    | 'commission_credited'
    | 'active'
    | 'pending'
    | 'rejected'
    | 'reversed';
  level: number;
  commissionAmount: number;
  commissionPaidAt?: string | null | undefined;
  isEligibleForMilestone: boolean;
  createdAt: string;
}

export interface MilestoneProgress {
  threshold: number;
  currentEligibleCount: number;
  remaining: number;
  progressPercentage: number;
  bonusAmountPaisa: number;
  bonusAmountPKR: number;
  isAchieved: boolean;
  achievementRecord?: {
    _id: string;
    threshold: number;
    bonusAmount: number;
    status: string;
    achievedAt: string;
    creditedAt?: string | undefined;
  } | null | undefined;
}

export interface FeeRefundProgress {
  userRegistrationPaid: boolean;
  feeAmountPaisa: number;
  feeAmountPKR: number;
  qualifyingCount: number;
  threshold: number;
  isEligible: boolean;
  refundRecord?: {
    _id: string;
    feeAmount: number;
    status:
      | 'ineligible'
      | 'eligible'
      | 'requested'
      | 'under_review'
      | 'approved'
      | 'rejected'
      | 'paid'
      | 'completed';
    payoutMethod?: 'wallet_credit' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | undefined;
    payoutDetails?: {
      accountTitle?: string | undefined;
      accountNumber?: string | undefined;
      bankName?: string | undefined;
      iban?: string | undefined;
    } | undefined;
    requestedAt?: string | undefined;
    adminNotes?: string | undefined;
    rejectionReason?: string | undefined;
    transactionReference?: string | undefined;
    paidAt?: string | undefined;
  } | null | undefined;
}

export interface ReferralActivity {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export interface ReferralDashboardResponse {
  referralCode: string;
  referralUrl: string;
  statistics: {
    totalReferred: number;
    pendingCount: number;
    eligibleCount: number;
    totalCommissionPaisa: number;
    totalCommissionPKR: number;
    milestoneBonusPaisa: number;
    milestoneBonusPKR: number;
    totalEarningsPaisa: number;
    totalEarningsPKR: number;
  };
  milestone: MilestoneProgress;
  feeRefund: FeeRefundProgress;
  directReferrals: DirectReferralItem[];
  recentActivity: ReferralActivity[];
}

export interface ReferralPolicy {
  commissionPerReferral: number;
  milestoneThreshold: number;
  milestoneBonus: number;
  registrationFee: number;
  refundEligibilityThreshold: number;
  policyVersion: number;
  effectiveDate: string;
  eligibilityRules: {
    requirePaidRegistration: boolean;
    requireActiveAccount: boolean;
    preventSelfReferral: boolean;
  };
}

export const referralApi = {
  getDashboard: async () => {
    const res = await apiClient.get<{ success: boolean; data: ReferralDashboardResponse }>(
      '/referrals/dashboard'
    );
    return res.data.data;
  },

  requestFeeRefund: async (data: {
    payoutMethod: 'wallet_credit' | 'easypaisa' | 'jazzcash' | 'bank_transfer';
    payoutDetails?: {
      accountTitle?: string | undefined;
      accountNumber?: string | undefined;
      bankName?: string | undefined;
      iban?: string | undefined;
    } | undefined;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: unknown }>(
      '/referrals/refund-request',
      data
    );
    return res.data;
  },

  // ─── Admin Endpoints ────────────────────────────────────────────────────────
  adminGetReferrals: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    status?: string | undefined;
    referrerId?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        _id: string;
        referrer: { _id: string; name: string; email: string; phone: string; referralCode: string };
        referee: RefereeInfo;
        referralCode: string;
        status: string;
        level: number;
        commissionAmount: number;
        isEligibleForMilestone: boolean;
        reversalReason?: string | undefined;
        reversedAt?: string | undefined;
        createdAt: string;
      }>;
      meta: PaginationMeta;
    }>('/referrals/admin/all', { params });
    return res.data;
  },

  adminReverseReferral: async (id: string, reason: string) => {
    const res = await apiClient.post<{ success: boolean; data: unknown }>(
      `/referrals/admin/${id}/reverse`,
      { reason }
    );
    return res.data;
  },

  adminGetMilestones: async (params?: { page?: number | undefined; limit?: number | undefined }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        _id: string;
        user: { _id: string; name: string; email: string; phone: string; referralCode: string };
        milestoneType: string;
        threshold: number;
        bonusAmount: number;
        status: string;
        achievedAt: string;
        creditedAt?: string | undefined;
      }>;
      meta: PaginationMeta;
    }>('/referrals/admin/milestones', { params });
    return res.data;
  },

  adminGetRefunds: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    status?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        _id: string;
        user: { _id: string; name: string; email: string; phone: string; referralCode: string };
        feeAmount: number;
        qualifyingReferralsCount: number;
        status: string;
        payoutMethod: string;
        payoutDetails?: {
          accountTitle?: string | undefined;
          accountNumber?: string | undefined;
          bankName?: string | undefined;
          iban?: string | undefined;
        } | undefined;
        requestedAt?: string | undefined;
        adminNotes?: string | undefined;
        rejectionReason?: string | undefined;
        transactionReference?: string | undefined;
        paidAt?: string | undefined;
      }>;
      meta: PaginationMeta;
    }>('/referrals/admin/refunds', { params });
    return res.data;
  },

  adminProcessRefund: async (
    id: string,
    data: {
      action: 'approve' | 'reject' | 'complete';
      notes?: string | undefined;
      transactionReference?: string | undefined;
    }
  ) => {
    const res = await apiClient.post<{ success: boolean; data: unknown }>(
      `/referrals/admin/refunds/${id}/review`,
      data
    );
    return res.data;
  },

  adminGetPolicy: async () => {
    const res = await apiClient.get<{ success: boolean; data: ReferralPolicy }>(
      '/referrals/admin/policy'
    );
    return res.data.data;
  },

  adminUpdatePolicy: async (policy: Partial<ReferralPolicy>) => {
    const res = await apiClient.put<{ success: boolean; data: ReferralPolicy }>(
      '/referrals/admin/policy',
      policy
    );
    return res.data.data;
  },
};
