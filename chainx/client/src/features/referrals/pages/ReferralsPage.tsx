import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  QrCode,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Wallet,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import {
  referralApi,
  type ReferralDashboardResponse,
  type DirectReferralItem,
} from '../referral.api';

export default function ReferralsPage(): React.ReactElement {
  const [data, setData] = useState<ReferralDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'wallet_credit' | 'easypaisa' | 'jazzcash' | 'bank_transfer'>('wallet_credit');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await referralApi.getDashboard();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ChainX with my referral link',
          text: `Earn direct referral rewards and automated yield nodes with ChainX! Use my referral code: ${data.referralCode}`,
          url: data.referralUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      copyToClipboard(data.referralUrl, 'link');
    }
  };

  const handleClaimRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRefund(true);
    setRefundSuccessMsg(null);
    try {
      await referralApi.requestFeeRefund({
        payoutMethod,
        payoutDetails:
          payoutMethod !== 'wallet_credit'
            ? {
                accountTitle: accountTitle.trim() || undefined,
                accountNumber: accountNumber.trim() || undefined,
                bankName: bankName.trim() || undefined,
              }
            : undefined,
      });
      setRefundSuccessMsg('Your Rs. 15,000 registration fee refund request has been submitted successfully!');
      setTimeout(() => {
        setIsRefundModalOpen(false);
        loadData();
      }, 2000);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit refund request.';
      alert(msg || 'Failed to submit refund request.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'commission_credited':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
            Commission Credited
          </Badge>
        );
      case 'eligible':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold text-[11px]">
            Eligible
          </Badge>
        );
      case 'payment_pending':
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
            Fee Pending
          </Badge>
        );
      case 'verification_pending':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold text-[11px]">
            Under Verification
          </Badge>
        );
      case 'reversed':
        return <Badge variant="danger">Reversed</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReferrals = (data?.directReferrals || []).filter((ref: DirectReferralItem) => {
    if (statusFilter === 'eligible' && !ref.isEligibleForMilestone) return false;
    if (statusFilter === 'pending' && ref.isEligibleForMilestone) return false;
    if (statusFilter === 'reversed' && ref.status !== 'reversed') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = ref.referee.name.toLowerCase().includes(term);
      const matchEmail = ref.referee.email.toLowerCase().includes(term);
      const matchPhone = ref.referee.phone.toLowerCase().includes(term);
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="h-28 rounded-2xl bg-muted/30 animate-pulse border border-border/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-bold">Failed to load referral data</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Please check your connection and try again.</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  const { statistics, milestone, feeRefund } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* ─── Hero / Referral Link Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Phase 5 Direct Referral System
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Rs. 1,500 / Direct Lead
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Invite Partners & Build Wealth
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Earn <span className="font-semibold text-foreground">Rs. 1,500</span> instantly for every eligible direct referral.
              Reach <span className="font-semibold text-foreground">10 verified referrals</span> to unlock an additional{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rs. 15,000 Milestone Bonus</span> plus an entire{' '}
              <span className="font-semibold text-primary">Rs. 15,000 Registration Fee Refund</span>!
            </p>
          </div>

          {/* Referral Link & Code Box */}
          <div className="bg-background/80 backdrop-blur-md rounded-xl p-4 border border-border/90 shadow-sm space-y-3 min-w-[320px] sm:min-w-[400px]">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                YOUR UNIQUE REFERRAL LINK
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.referralUrl}
                  className="w-full text-xs font-mono bg-muted/50 border border-input rounded-lg px-3 py-2 text-foreground select-all focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 gap-1 text-xs shrink-0 font-medium"
                  onClick={() => copyToClipboard(data.referralUrl, 'link')}
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Code:</span>
                <span className="font-mono font-bold text-sm text-primary tracking-wider">{data.referralCode}</span>
                <button
                  onClick={() => copyToClipboard(data.referralCode, 'code')}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => setShowQrModal(true)}
                >
                  <QrCode className="h-3.5 w-3.5" /> QR Code
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs gap-1 font-semibold"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 Statistics Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Direct Referrals */}
        <Card className="p-5 border-border/80 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Direct Leads</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{statistics.totalReferred}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{statistics.eligibleCount} active</span> &bull; {statistics.pendingCount} pending
            </p>
          </div>
        </Card>

        {/* Direct Commissions */}
        <Card className="p-5 border-border/80 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Direct Commissions</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">
              Rs. {statistics.totalCommissionPKR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Rs. 1,500 per paid lead</p>
          </div>
        </Card>

        {/* 10-Milestone Bonus */}
        <Card className="p-5 border-border/80 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Milestone Bonus</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">
              Rs. {statistics.milestoneBonusPKR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {milestone.isAchieved ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Unlocked & Credited
                </span>
              ) : (
                `${milestone.remaining} more leads to unlock Rs. 15,000`
              )}
            </p>
          </div>
        </Card>

        {/* Total Referral Earnings */}
        <Card className="p-5 border-border/80 bg-gradient-to-br from-card to-primary/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-primary">
              Rs. {statistics.totalEarningsPKR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Direct Commissions + Milestone</p>
          </div>
        </Card>
      </div>

      {/* ─── Milestone & Fee Refund Progress Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone Progress Card */}
        <Card className="p-6 border-border/80 shadow-sm space-y-5 bg-card">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-base text-foreground">
                  10-Referral Milestone: Rs. 15,000 Bonus
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Qualify 10 direct paid partners to earn a one-time additional Rs. 15,000 reward credited directly to your financial wallet.
              </p>
            </div>
            {milestone.isAchieved && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                Achieved & Paid
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-foreground">
                Progress: <span className="text-primary">{milestone.currentEligibleCount}</span> / {milestone.threshold} Qualifying Leads
              </span>
              <span className="font-mono text-muted-foreground font-semibold">
                {milestone.progressPercentage}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden p-0.5 border border-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                style={{ width: `${milestone.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Compensation Breakdown:</span>
              <span className="font-semibold text-foreground">
                10 Leads &times; Rs. 1,500 = Rs. 15,000 + Rs. 15,000 Bonus ={' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rs. 30,000</span>
              </span>
            </div>
            {!milestone.isAchieved ? (
              <span className="font-medium text-amber-600 dark:text-amber-400 shrink-0">
                {milestone.remaining} leads left
              </span>
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Complete
              </span>
            )}
          </div>
        </Card>

        {/* Registration Fee Refund Card */}
        <Card className="p-6 border-border/80 shadow-sm space-y-5 bg-card">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  Registration Fee Refund Eligibility
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Your own Rs. 15,000 registration fee becomes eligible for 100% refund once you achieve 10 qualifying direct referrals.
              </p>
            </div>
            {feeRefund.refundRecord ? (
              <Badge className="capitalize font-semibold">
                {feeRefund.refundRecord.status.replace('_', ' ')}
              </Badge>
            ) : feeRefund.isEligible ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                Eligible to Claim
              </Badge>
            ) : (
              <Badge variant="secondary">Ineligible</Badge>
            )}
          </div>

          {/* Refund Status Body */}
          <div className="rounded-xl bg-muted/40 p-4 border border-border/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Original Registration Fee Paid:</span>
              <span className="font-bold text-foreground">
                Rs. {feeRefund.feeAmountPKR.toLocaleString()} {feeRefund.userRegistrationPaid ? '(Paid)' : '(Unpaid)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Eligible Direct Leads:</span>
              <span className="font-bold text-foreground">
                {feeRefund.qualifyingCount} / {feeRefund.threshold} required
              </span>
            </div>

            {feeRefund.refundRecord?.transactionReference && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Payout Reference:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {feeRefund.refundRecord.transactionReference}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {feeRefund.isEligible && !feeRefund.refundRecord && (
            <Button
              className="w-full gap-2 font-semibold shadow-sm"
              onClick={() => setIsRefundModalOpen(true)}
            >
              Claim Rs. 15,000 Registration Fee Refund <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {feeRefund.refundRecord && feeRefund.refundRecord.status === 'requested' && (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Refund claim is under administrative review.
            </div>
          )}

          {feeRefund.refundRecord && feeRefund.refundRecord.status === 'completed' && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Registration fee of Rs. 15,000 has been successfully refunded!
            </div>
          )}

          {!feeRefund.isEligible && !feeRefund.refundRecord && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Refund is a separate transaction, not referral commission.
            </p>
          )}
        </Card>
      </div>

      {/* ─── Direct Referrals Table Section ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Direct Referrals (Level 1)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track registration payment, account verification, and commission crediting lifecycle for your direct leads.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-44 sm:w-56 text-xs pl-8"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {['all', 'eligible', 'pending', 'reversed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                    statusFilter === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Referred User</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Lifecycle Stage</th>
                  <th className="px-5 py-3.5">Commission</th>
                  <th className="px-5 py-3.5 text-right">Milestone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No direct referrals match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((r: DirectReferralItem) => (
                    <tr key={r._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground text-sm">{r.referee.name}</div>
                        <div className="text-[11px] text-muted-foreground">{r.referee.email}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        {r.referee.registrationPaymentStatus === 'paid' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> Paid (Rs. 15k)
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize font-medium text-foreground">
                          {r.referee.accountStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-foreground">
                          Rs. {(r.commissionAmount / 100).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {r.isEligibleForMilestone ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                            Counted (1/10)
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
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

      {/* ─── Financial Activity Ledger (Commissions & Bonuses) ────────────────── */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Earnings History</h3>
          <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reward Type</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.recentActivity.map((act) => (
                    <tr key={act._id} className="hover:bg-muted/20">
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(act.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          className={
                            act.type === 'milestone_bonus'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }
                        >
                          {act.type === 'milestone_bonus' ? 'Milestone Bonus' : 'Direct Referral'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">{act.description}</td>
                      <td className="px-5 py-3 text-right font-bold text-foreground">
                        +Rs. {(act.amount / 100).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Claim Refund Modal ──────────────────────────────────────────────── */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Claim Registration Fee Refund</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  10 qualifying referrals verified. You are entitled to a full Rs. 15,000 refund.
                </p>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleClaimRefund} className="p-6 space-y-4">
              {refundSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {refundSuccessMsg}
                </div>
              )}

              <FormField label="Payout Destination Method">
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as never)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="wallet_credit">ChainX Wallet Balance (Instant Credit)</option>
                  <option value="easypaisa">EasyPaisa Mobile Account</option>
                  <option value="jazzcash">JazzCash Mobile Account</option>
                  <option value="bank_transfer">Pakistani Bank Account (IBAN)</option>
                </select>
              </FormField>

              {payoutMethod !== 'wallet_credit' && (
                <>
                  <FormField label="Account Title / Full Name">
                    <Input
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>

                  <FormField label="Account Number / Phone / IBAN">
                    <Input
                      required
                      placeholder="e.g. 03451234567 or PK..."
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>

                  {payoutMethod === 'bank_transfer' && (
                    <FormField label="Bank Name">
                      <Input
                        required
                        placeholder="e.g. Meezan Bank, HBL, Allied Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="text-xs"
                      />
                    </FormField>
                  )}
                </>
              )}

              <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">Policy Clarification:</span>
                This refund is an independent transaction returning your original Rs. 15,000 security fee. It does not alter your referral commissions or milestone bonuses.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRefundModalOpen(false)}
                  disabled={isSubmittingRefund}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingRefund} className="gap-1.5 font-semibold">
                  {isSubmittingRefund ? 'Submitting...' : 'Confirm & Submit Claim'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── QR Code Modal ──────────────────────────────────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border-border bg-card shadow-2xl p-6 text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Scan Referral QR</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto border shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  data.referralUrl
                )}`}
                alt="Referral QR Code"
                className="h-44 w-44"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Scan with camera or mobile phone to open registration page with code{' '}
              <span className="font-bold text-primary">{data.referralCode}</span>.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1"
              onClick={() => copyToClipboard(data.referralUrl, 'link')}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Copy Web Link
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
