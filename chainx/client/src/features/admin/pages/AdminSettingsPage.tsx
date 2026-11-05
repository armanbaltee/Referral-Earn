import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Share2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { adminApi } from '../../dashboard/admin.api';

export default function AdminSettingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'fee' | 'referral' | 'general'>('fee');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings State
  const [regFee, setRegFee] = useState<any>({
    amount: 1500000,
    currency: 'PKR',
    easypaisa: { accountTitle: '', accountNumber: '', instructions: '' },
    jazzcash: { accountTitle: '', accountNumber: '', instructions: '' },
    bankTransfer: { bankName: '', accountTitle: '', accountNumber: '', iban: '' },
    automatedSandboxEnabled: true,
    manualEnabled: true,
  });

  const [refPolicy, setRefPolicy] = useState<any>({
    commissionPerReferral: 150000,
    milestoneThreshold: 10,
    milestoneBonus: 1500000,
    refundEligibleThreshold: 10,
    policyVersion: 1,
  });

  const [genConfig, setGenConfig] = useState<any>({
    platformName: 'ChainX',
    supportEmail: 'support@chainx.example',
    supportPhone: '+92 300 1234567',
    maintenanceMode: false,
    minWithdrawalPaisa: 50000,
    maxWithdrawalPaisa: 50000000,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await adminApi.getSettings();
      if (data.registrationFee) setRegFee(data.registrationFee);
      if (data.referralPolicy) setRefPolicy(data.referralPolicy);
      if (data.general) setGenConfig(data.general);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveRegistrationFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await adminApi.updateRegistrationFeeConfig(regFee);
      setSuccessMsg('Registration fee and merchant bank accounts updated successfully.');
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update registration fee');
    } finally {
      setSaving(false);
    }
  };

  const saveReferralPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await adminApi.updateReferralPolicy(refPolicy);
      setSuccessMsg('Referral commission policy bumped to next version successfully.');
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update referral policy');
    } finally {
      setSaving(false);
    }
  };

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await adminApi.updateGeneralConfig(genConfig);
      setSuccessMsg('Platform general settings and limits updated successfully.');
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update general settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Configuration</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global business rules, bank account coordinates, commission policy versioning, and operational controls.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchSettings}
          disabled={loading}
          className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('fee')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'fee'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Registration Fee &amp; Merchant Accounts
        </button>

        <button
          onClick={() => setActiveTab('referral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'referral'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Referral &amp; Milestone Policy
          <Badge className="bg-slate-800 text-blue-300 border border-slate-700 text-[10px]">
            v{refPolicy.policyVersion || 1}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="h-4 w-4" />
          General &amp; Limits
        </button>
      </div>

      {/* Tab 1: Registration Fee */}
      {activeTab === 'fee' && (
        <form onSubmit={saveRegistrationFee} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              Registration Fee Amount
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Registration Fee in PKR (Calculated in Paisa)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rs.</span>
                  <Input
                    type="number"
                    value={Math.floor(regFee.amount / 100)}
                    onChange={(e) =>
                      setRegFee({ ...regFee, amount: Number(e.target.value) * 100 })
                    }
                    className="pl-10 bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Paisa value: {regFee.amount} (Initial standard: Rs. 15,000)
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Currency Code</label>
                <Input
                  value={regFee.currency || 'PKR'}
                  onChange={(e) => setRegFee({ ...regFee, currency: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 uppercase font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regFee.manualEnabled}
                  onChange={(e) => setRegFee({ ...regFee, manualEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-200">Enable Manual Slip Upload Mode</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regFee.automatedSandboxEnabled}
                  onChange={(e) => setRegFee({ ...regFee, automatedSandboxEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-200">Enable Automated Provider Sandbox</span>
              </label>
            </div>
          </div>

          {/* EasyPaisa Coordinates */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              EasyPaisa Merchant Coordinates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">EasyPaisa Account Title</label>
                <Input
                  value={regFee.easypaisa?.accountTitle || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      easypaisa: { ...regFee.easypaisa, accountTitle: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">EasyPaisa Mobile Number</label>
                <Input
                  value={regFee.easypaisa?.accountNumber || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      easypaisa: { ...regFee.easypaisa, accountNumber: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">EasyPaisa Payment Instructions</label>
              <Textarea
                rows={2}
                value={regFee.easypaisa?.instructions || ''}
                onChange={(e) =>
                  setRegFee({
                    ...regFee,
                    easypaisa: { ...regFee.easypaisa, instructions: e.target.value },
                  })
                }
                className="bg-slate-950 border-slate-800 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* JazzCash Coordinates */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              JazzCash Merchant Coordinates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">JazzCash Account Title</label>
                <Input
                  value={regFee.jazzcash?.accountTitle || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      jazzcash: { ...regFee.jazzcash, accountTitle: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">JazzCash Mobile Number</label>
                <Input
                  value={regFee.jazzcash?.accountNumber || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      jazzcash: { ...regFee.jazzcash, accountNumber: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">JazzCash Payment Instructions</label>
              <Textarea
                rows={2}
                value={regFee.jazzcash?.instructions || ''}
                onChange={(e) =>
                  setRegFee({
                    ...regFee,
                    jazzcash: { ...regFee.jazzcash, instructions: e.target.value },
                  })
                }
                className="bg-slate-950 border-slate-800 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Bank Transfer Coordinates */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Direct Commercial Bank Transfer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Bank Name</label>
                <Input
                  value={regFee.bankTransfer?.bankName || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      bankTransfer: { ...regFee.bankTransfer, bankName: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Account Title</label>
                <Input
                  value={regFee.bankTransfer?.accountTitle || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      bankTransfer: { ...regFee.bankTransfer, accountTitle: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Account Number</label>
                <Input
                  value={regFee.bankTransfer?.accountNumber || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      bankTransfer: { ...regFee.bankTransfer, accountNumber: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">IBAN</label>
                <Input
                  value={regFee.bankTransfer?.iban || ''}
                  onChange={(e) =>
                    setRegFee({
                      ...regFee,
                      bankTransfer: { ...regFee.bankTransfer, iban: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save Registration Fee Settings'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Referral Commission & Milestone Policy */}
      {activeTab === 'referral' && (
        <form onSubmit={saveReferralPolicy} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-rose-400" />
                  Versioned Referral Compensation Policy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updates automatically advance the policy version and record immutable audit diffs.
                </p>
              </div>
              <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs">
                Active Policy: v{refPolicy.policyVersion || 1}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Commission per Direct Eligible Referral (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rs.</span>
                  <Input
                    type="number"
                    value={Math.floor(refPolicy.commissionPerReferral / 100)}
                    onChange={(e) =>
                      setRefPolicy({
                        ...refPolicy,
                        commissionPerReferral: Number(e.target.value) * 100,
                      })
                    }
                    className="pl-10 bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Current policy: Rs. 1,500 per verified referral
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Milestone Referral Threshold (Count)
                </label>
                <Input
                  type="number"
                  value={refPolicy.milestoneThreshold}
                  onChange={(e) =>
                    setRefPolicy({
                      ...refPolicy,
                      milestoneThreshold: Number(e.target.value),
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Required number of direct paid referrals to unlock bonus (Default: 10)
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Milestone Additional Bonus (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rs.</span>
                  <Input
                    type="number"
                    value={Math.floor(refPolicy.milestoneBonus / 100)}
                    onChange={(e) =>
                      setRefPolicy({
                        ...refPolicy,
                        milestoneBonus: Number(e.target.value) * 100,
                      })
                    }
                    className="pl-10 bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Bonus awarded upon hitting threshold (Default: Rs. 15,000)
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  100% Fee Refund Eligibility Threshold (Count)
                </label>
                <Input
                  type="number"
                  value={refPolicy.refundEligibleThreshold || 10}
                  onChange={(e) =>
                    setRefPolicy({
                      ...refPolicy,
                      refundEligibleThreshold: Number(e.target.value),
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Referral count required to unlock full registration fee refund claim (Default: 10)
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Versioning...' : `Publish Policy v${(refPolicy.policyVersion || 1) + 1}`}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: General & Withdrawal Limits */}
      {activeTab === 'general' && (
        <form onSubmit={saveGeneral} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              General Platform Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Platform Brand Name</label>
                <Input
                  value={genConfig.platformName || 'ChainX'}
                  onChange={(e) => setGenConfig({ ...genConfig, platformName: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Support Desk Email</label>
                <Input
                  value={genConfig.supportEmail || ''}
                  onChange={(e) => setGenConfig({ ...genConfig, supportEmail: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Support Desk Phone / WhatsApp</label>
                <Input
                  value={genConfig.supportPhone || ''}
                  onChange={(e) => setGenConfig({ ...genConfig, supportPhone: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Maintenance Mode</div>
                <div className="text-[11px] text-slate-400">
                  When enabled, only administrators can access the platform. Members see maintenance splash.
                </div>
              </div>
              <input
                type="checkbox"
                checked={genConfig.maintenanceMode}
                onChange={(e) => setGenConfig({ ...genConfig, maintenanceMode: e.target.checked })}
                className="h-5 w-5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-400" />
              Member Withdrawal Limits (PKR)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Minimum Single Withdrawal (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rs.</span>
                  <Input
                    type="number"
                    value={Math.floor((genConfig.minWithdrawalPaisa || 50000) / 100)}
                    onChange={(e) =>
                      setGenConfig({
                        ...genConfig,
                        minWithdrawalPaisa: Number(e.target.value) * 100,
                      })
                    }
                    className="pl-10 bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Maximum Single Withdrawal (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rs.</span>
                  <Input
                    type="number"
                    value={Math.floor((genConfig.maxWithdrawalPaisa || 50000000) / 100)}
                    onChange={(e) =>
                      setGenConfig({
                        ...genConfig,
                        maxWithdrawalPaisa: Number(e.target.value) * 100,
                      })
                    }
                    className="pl-10 bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save General Platform Configuration'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
