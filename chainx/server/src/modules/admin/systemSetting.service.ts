import { SystemSetting } from './systemSetting.model.js';
import { AuditLog, AuditAction } from './auditLog.model.js';
import mongoose from 'mongoose';

export interface RegistrationFeeConfig {
  amount: number; // in paisa (1500000 = Rs. 15,000)
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

const DEFAULT_REGISTRATION_CONFIG: RegistrationFeeConfig = {
  amount: 1500000, // Rs. 15,000
  currency: 'PKR',
  easypaisa: {
    accountTitle: 'ChainX Financial Services',
    accountNumber: '03457711993',
    instructions: 'Send Rs. 15,000 to the EasyPaisa account above. Enter the 11-digit TRX ID and upload receipt.',
  },
  jazzcash: {
    accountTitle: 'ChainX Technologies',
    accountNumber: '03018844221',
    instructions: 'Send Rs. 15,000 via JazzCash app or retailer till. Enter the TID from confirmation SMS.',
  },
  bankTransfer: {
    bankName: 'Meezan Bank Ltd',
    accountTitle: 'ChainX Technologies (Pvt) Ltd',
    accountNumber: '01010105829102',
    iban: 'PK49MEZN0001010105829102',
  },
  crypto: {
    network: 'TRON (TRC-20)',
    currency: 'USDT',
    amount: 55,
    walletAddress: 'TXchainX99PlatformOfficialWalletTRC20',
  },
  automatedSandboxEnabled: true,
  manualEnabled: true,
};

export class SystemSettingService {
  public static async getRegistrationFeeConfig(): Promise<RegistrationFeeConfig> {
    const setting = await SystemSetting.findOne({ key: 'registration_fee' }).lean();
    if (!setting) {
      // Seed default configuration in database
      await SystemSetting.create({
        key: 'registration_fee',
        value: DEFAULT_REGISTRATION_CONFIG as unknown as Record<string, unknown>,
        description: 'System registration fee amount, accounts and provider configurations',
        category: 'payment',
      });
      return DEFAULT_REGISTRATION_CONFIG;
    }
    return setting.value as unknown as RegistrationFeeConfig;
  }

  public static async updateRegistrationFeeConfig(
    config: Partial<RegistrationFeeConfig>,
    adminId: string
  ): Promise<RegistrationFeeConfig> {
    const current = await this.getRegistrationFeeConfig();
    const updated = {
      ...current,
      ...config,
      easypaisa: { ...current.easypaisa, ...(config.easypaisa || {}) },
      jazzcash: { ...current.jazzcash, ...(config.jazzcash || {}) },
      bankTransfer: { ...current.bankTransfer, ...(config.bankTransfer || {}) },
      crypto: { ...current.crypto, ...(config.crypto || {}) },
    };

    await SystemSetting.findOneAndUpdate(
      { key: 'registration_fee' },
      {
        value: updated as unknown as Record<string, unknown>,
        updatedBy: new mongoose.Types.ObjectId(adminId),
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.SYSTEM_CONFIG_UPDATED,
      target: new mongoose.Types.ObjectId(adminId),
      targetModel: 'SystemSetting',
      description: `Registration fee configuration updated. New amount: Rs. ${updated.amount / 100}`,
    });

    return updated;
  }

  // ─── Phase 5: Referral Commission & Milestone Policy ───────────────────────
  public static async getReferralCommissionPolicy(): Promise<ReferralCommissionPolicy> {
    const setting = await SystemSetting.findOne({ key: 'referral_commission_policy' }).lean();
    if (!setting) {
      await SystemSetting.create({
        key: 'referral_commission_policy',
        value: DEFAULT_REFERRAL_POLICY as unknown as Record<string, unknown>,
        description: 'Referral commission per direct lead, 10-referral milestone bonus, and fee refund policy',
        category: 'commission',
      });
      return DEFAULT_REFERRAL_POLICY;
    }
    return setting.value as unknown as ReferralCommissionPolicy;
  }

  public static async updateReferralCommissionPolicy(
    policy: Partial<ReferralCommissionPolicy>,
    adminId: string
  ): Promise<ReferralCommissionPolicy> {
    const current = await this.getReferralCommissionPolicy();
    const newVersion = (current.policyVersion || 1) + 1;
    const updated: ReferralCommissionPolicy = {
      ...current,
      ...policy,
      policyVersion: newVersion,
      effectiveDate: new Date().toISOString(),
      eligibilityRules: {
        ...current.eligibilityRules,
        ...(policy.eligibilityRules || {}),
      },
    };

    await SystemSetting.findOneAndUpdate(
      { key: 'referral_commission_policy' },
      {
        value: updated as unknown as Record<string, unknown>,
        updatedBy: new mongoose.Types.ObjectId(adminId),
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.SYSTEM_CONFIG_UPDATED,
      target: new mongoose.Types.ObjectId(adminId),
      targetModel: 'SystemSetting',
      description: `Referral commission policy updated to v${newVersion}. Commission: Rs. ${updated.commissionPerReferral / 100}, Milestone Bonus: Rs. ${updated.milestoneBonus / 100}`,
      changes: { oldVersion: current.policyVersion, newVersion },
    });

    return updated;
  }
}

export interface ReferralCommissionPolicy {
  commissionPerReferral: number; // in paisa (150000 = Rs. 1,500)
  milestoneThreshold: number; // 10 referrals
  milestoneBonus: number; // in paisa (1500000 = Rs. 15,000)
  registrationFee: number; // in paisa (1500000 = Rs. 15,000)
  refundEligibilityThreshold: number; // 10 referrals
  policyVersion: number;
  effectiveDate: string;
  eligibilityRules: {
    requirePaidRegistration: boolean;
    requireActiveAccount: boolean;
    preventSelfReferral: boolean;
  };
}

const DEFAULT_REFERRAL_POLICY: ReferralCommissionPolicy = {
  commissionPerReferral: 150000, // Rs. 1,500
  milestoneThreshold: 10,
  milestoneBonus: 1500000, // Rs. 15,000
  registrationFee: 1500000, // Rs. 15,000
  refundEligibilityThreshold: 10,
  policyVersion: 1,
  effectiveDate: '2026-01-01T00:00:00.000Z',
  eligibilityRules: {
    requirePaidRegistration: true,
    requireActiveAccount: true,
    preventSelfReferral: true,
  },
};
