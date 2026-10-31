import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Gift,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import { referralApi, type ReferralPolicy } from '../referral.api';

interface AdminReferralItem {
  _id: string;
  referrer: { _id: string; name: string; email: string; phone: string; referralCode: string };
  referee: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    accountStatus: string;
    registrationPaymentStatus: string;
    createdAt: string;
  };
  referralCode: string;
  status: string;
  level: number;
  commissionAmount: number;
  isEligibleForMilestone: boolean;
  reversalReason?: string | undefined;
  reversedAt?: string | undefined;
  createdAt: string;
}

interface MilestoneItem {
  _id: string;
  user: { _id: string; name: string; email: string; phone: string; referralCode: string };
  milestoneType: string;
  threshold: number;
  bonusAmount: number;
  status: string;
  achievedAt: string;
  creditedAt?: string | undefined;
}

interface RefundItem {
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
}

export default function AdminReferralsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'referrals' | 'milestones' | 'refunds' | 'policy'>('referrals');

  // Referrals Tab State
  const [referrals, setReferrals] = useState<AdminReferralItem[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reversal Modal State
  const [reversalTarget, setReversalTarget] = useState<AdminReferralItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isProcessingReversal, setIsProcessingReversal] = useState(false);

  // Milestones Tab State
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);

  // Refunds Tab State
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
  const [refundAction, setRefundAction] = useState<'approve' | 'reject' | null>(null);
  const [refundNotes, setRefundNotes] = useState('');
  const [refundTxRef, setRefundTxRef] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Policy Tab State
  const [policy, setPolicy] = useState<ReferralPolicy | null>(null);
  const [commissionPKR, setCommissionPKR] = useState('1500');
  const [milestoneBonusPKR, setMilestoneBonusPKR] = useState('15000');
  const [milestoneThreshold, setMilestoneThreshold] = useState('10');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policySavedMsg, setPolicySavedMsg] = useState(false);

  // Load Referrals
  const loadReferrals = useCallback(async () => {
    setIsLoadingReferrals(true);
    try {
      const res = await referralApi.adminGetReferrals({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setReferrals(res.data || []);
    } catch {
      setReferrals([]);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [search, statusFilter]);

  // Load Milestones
  const loadMilestones = useCallback(async () => {
    setIsLoadingMilestones(true);
    try {
      const res = await referralApi.adminGetMilestones();
      setMilestones(res.data || []);
    } catch {
      setMilestones([]);
    } finally {
      setIsLoadingMilestones(false);
    }
  }, []);

  // Load Refunds
  const loadRefunds = useCallback(async () => {
    setIsLoadingRefunds(true);
    try {
      const res = await referralApi.adminGetRefunds();
      setRefunds(res.data || []);
    } catch {
      setRefunds([]);
    } finally {
      setIsLoadingRefunds(false);
    }
  }, []);

  // Load Policy
  const loadPolicy = useCallback(async () => {
    try {
      const p = await referralApi.adminGetPolicy();
      setPolicy(p);
      setCommissionPKR((p.commissionPerReferral / 100).toString());
      setMilestoneBonusPKR((p.milestoneBonus / 100).toString());
      setMilestoneThreshold(p.milestoneThreshold.toString());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'referrals') loadReferrals();
    else if (activeTab === 'milestones') loadMilestones();
    else if (activeTab === 'refunds') loadRefunds();
    else if (activeTab === 'policy') loadPolicy();
  }, [activeTab, loadReferrals, loadMilestones, loadRefunds, loadPolicy]);

  const handleReverseReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason.trim()) return;
    setIsProcessingReversal(true);
    try {
      await referralApi.adminReverseReferral(reversalTarget._id, reversalReason.trim());
      setReversalTarget(null);
      setReversalReason('');
      loadReferrals();
    } catch {
      alert('Failed to reverse referral.');
    } finally {
      setIsProcessingReversal(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund || !refundAction) return;
    setIsProcessingRefund(true);
    try {
      await referralApi.adminProcessRefund(selectedRefund._id, {
        action: refundAction === 'approve' ? 'approve' : 'reject',
        notes: refundNotes.trim() || undefined,
        transactionReference: refundTxRef.trim() || undefined,
      });
      setSelectedRefund(null);
      setRefundAction(null);
      setRefundNotes('');
      setRefundTxRef('');
      loadRefunds();
    } catch {
      alert('Failed to process refund.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    setPolicySavedMsg(false);
    try {
      const updated = await referralApi.adminUpdatePolicy({
        commissionPerReferral: Math.round(parseFloat(commissionPKR) * 100),
        milestoneBonus: Math.round(parseFloat(milestoneBonusPKR) * 100),
        milestoneThreshold: parseInt(milestoneThreshold, 10),
      });
      setPolicy(updated);
      setPolicySavedMsg(true);
      setTimeout(() => setPolicySavedMsg(false), 3000);
    } catch {
      alert('Failed to update referral policy.');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Referral & Compensation Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audit direct affiliate lineages, reverse fraudulent leads, review 10-milestone rewards, and process registration fee refunds.
        </p>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'referrals'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" /> All Referrals
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'milestones'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Gift className="h-4 w-4" /> Milestone Achievements
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'refunds'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Fee Refund Queue
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'policy'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" /> Commission Policy
        </button>
      </div>

      {/* ─── TAB 1: ALL REFERRALS ────────────────────────────────────────────── */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search referrer or referee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 text-xs pl-8"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {['all', 'eligible', 'payment_pending', 'commission_credited', 'reversed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium ${
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Referrer</th>
                    <th className="px-5 py-3.5">Referred Lead</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Fee Status</th>
                    <th className="px-5 py-3.5">Lifecycle Status</th>
                    <th className="px-5 py-3.5">Commission</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingReferrals ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                        Loading referral linkages...
                      </td>
                    </tr>
                  ) : referrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                        No referrals found.
                      </td>
                    </tr>
                  ) : (
                    referrals.map((r: AdminReferralItem) => (
                      <tr key={r._id} className="hover:bg-muted/20">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground text-sm">{r.referrer?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-muted-foreground">{r.referrer?.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground text-sm">{r.referee?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-muted-foreground">{r.referee?.email}</div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-primary text-xs">
                          {r.referralCode}
                        </td>
                        <td className="px-5 py-4">
                          {r.referee?.registrationPaymentStatus === 'paid' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Paid (Rs. 15k)
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">Unpaid</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            className={
                              r.status === 'commission_credited'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : r.status === 'reversed'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {r.status.replace('_', ' ')}
                          </Badge>
                          {r.reversalReason && (
                            <span className="text-[10px] text-destructive block mt-1">
                              Reason: {r.reversalReason}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          Rs. {(r.commissionAmount / 100).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {r.status !== 'reversed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                              onClick={() => {
                                setReversalTarget(r);
                                setReversalReason('');
                              }}
                            >
                              <RotateCcw className="h-3 w-3" /> Reverse
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: MILESTONE ACHIEVEMENTS ───────────────────────────────────── */}
      {activeTab === 'milestones' && (
        <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Milestone Type</th>
                  <th className="px-5 py-3.5">Required Leads</th>
                  <th className="px-5 py-3.5">Bonus Awarded</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Credited Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingMilestones ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      Loading milestone achievements...
                    </td>
                  </tr>
                ) : milestones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <Gift className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No users have achieved the 10-referral milestone yet.
                    </td>
                  </tr>
                ) : (
                  milestones.map((m: MilestoneItem) => (
                    <tr key={m._id} className="hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground text-sm">{m.user?.name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-foreground">
                        {m.milestoneType}
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">
                        {m.threshold} Direct Referrals
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        Rs. {(m.bonusAmount / 100).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {m.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {new Date(m.creditedAt || m.achievedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── TAB 3: REGISTRATION FEE REFUND QUEUE ─────────────────────────────── */}
      {activeTab === 'refunds' && (
        <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Refund Fee</th>
                  <th className="px-5 py-3.5">Qualifying Leads</th>
                  <th className="px-5 py-3.5">Payout Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reference / Notes</th>
                  <th className="px-5 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingRefunds ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                      Loading refund requests...
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No registration fee refund requests found.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref: RefundItem) => (
                    <tr key={ref._id} className="hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground text-sm">{ref.user?.name}</div>
                        <div className="text-[11px] text-muted-foreground">{ref.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-black text-foreground">
                        Rs. {(ref.feeAmount / 100).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {ref.qualifyingReferralsCount} Verified Leads
                      </td>
                      <td className="px-5 py-4 capitalize font-medium text-foreground">
                        {ref.payoutMethod.replace('_', ' ')}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={
                            ref.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : ref.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }
                        >
                          {ref.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {ref.transactionReference ? (
                          <span className="font-mono text-foreground font-semibold">{ref.transactionReference}</span>
                        ) : (
                          ref.rejectionReason || 'None'
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {ref.status === 'requested' || ref.status === 'under_review' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                setSelectedRefund(ref);
                                setRefundAction('approve');
                                setRefundNotes('');
                                setRefundTxRef('');
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedRefund(ref);
                                setRefundAction('reject');
                                setRefundNotes('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── TAB 4: COMMISSION POLICY ENGINE ─────────────────────────────────── */}
      {activeTab === 'policy' && (
        <Card className="max-w-3xl border-border/80 p-6 space-y-6 bg-card shadow-sm">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Direct Referral & Milestone Compensation Policy
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current Policy Version: <span className="font-mono font-bold text-primary">v{policy?.policyVersion || 1}</span> &bull; Effective: {new Date(policy?.effectiveDate || '').toLocaleDateString()}
            </p>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-4">
            {policySavedMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Policy updated and version incremented. Historical records preserved.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Commission per Direct Lead (Rs.)">
                <Input
                  type="number"
                  value={commissionPKR}
                  onChange={(e) => setCommissionPKR(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Milestone Target Threshold (Leads)">
                <Input
                  type="number"
                  value={milestoneThreshold}
                  onChange={(e) => setMilestoneThreshold(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Milestone Bonus (Rs.)">
                <Input
                  type="number"
                  value={milestoneBonusPKR}
                  onChange={(e) => setMilestoneBonusPKR(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Registration Fee Refund Threshold (Leads)">
                <Input
                  type="number"
                  readOnly
                  disabled
                  value="10"
                  className="text-xs bg-muted/50 cursor-not-allowed"
                />
              </FormField>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Compensation Integrity Rule:</span>
              Changes to compensation parameters are versioned and immediately effective for new qualifying actions. Historical ledger earnings are never recalculated retrospectively.
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingPolicy} className="font-semibold text-xs">
                {isSavingPolicy ? 'Saving Changes...' : 'Save & Publish Policy Version'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ─── Reversal Confirmation Modal ────────────────────────────────────── */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Reverse Referral Lead
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This will revoke milestone credit and debit Rs. {(reversalTarget.commissionAmount / 100).toLocaleString()} from the referrer&apos;s wallet.
                </p>
              </div>
              <button
                onClick={() => setReversalTarget(null)}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReverseReferral} className="space-y-4">
              <FormField label="Reason for Reversal (Mandatory Audit Trail)">
                <Input
                  required
                  placeholder="e.g. Fraudulent registration, payment chargeback, duplicate"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReversalTarget(null)}
                  disabled={isProcessingReversal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isProcessingReversal}
                >
                  {isProcessingReversal ? 'Reversing...' : 'Confirm Reversal'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Refund Review Modal ────────────────────────────────────────────── */}
      {selectedRefund && refundAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-foreground capitalize">
                  {refundAction} Registration Fee Refund
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  User: {selectedRefund.user?.name} ({selectedRefund.user?.email}) &bull; Rs. {(selectedRefund.feeAmount / 100).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedRefund(null);
                  setRefundAction(null);
                }}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Payout Method: </span>
                <span className="font-semibold text-foreground uppercase">{selectedRefund.payoutMethod.replace('_', ' ')}</span>
              </div>
              {selectedRefund.payoutDetails && (
                <div>
                  <span className="text-muted-foreground">Account Details: </span>
                  <span className="font-mono text-foreground">
                    {selectedRefund.payoutDetails.accountTitle} ({selectedRefund.payoutDetails.accountNumber}) - {selectedRefund.payoutDetails.bankName || ''}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              {refundAction === 'approve' && selectedRefund.payoutMethod !== 'wallet_credit' && (
                <FormField label="Bank / Mobile Wallet Transaction Reference">
                  <Input
                    required
                    placeholder="e.g. TRX9847291038"
                    value={refundTxRef}
                    onChange={(e) => setRefundTxRef(e.target.value)}
                    className="text-xs"
                  />
                </FormField>
              )}

              <FormField label={refundAction === 'approve' ? 'Internal Admin Notes (Optional)' : 'Rejection Reason (Required)'}>
                <Input
                  required={refundAction === 'reject'}
                  placeholder={refundAction === 'approve' ? 'Audit notes...' : 'Reason for rejection...'}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedRefund(null);
                    setRefundAction(null);
                  }}
                  disabled={isProcessingRefund}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingRefund}
                  className={refundAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 font-semibold' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold'}
                >
                  {isProcessingRefund ? 'Processing...' : `Confirm ${refundAction}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
