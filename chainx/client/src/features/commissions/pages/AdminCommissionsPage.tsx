import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Gift,
  RefreshCw,
  Filter,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { referralApi } from '../../referrals/referral.api';
import { adminApi } from '../../dashboard/admin.api';

function formatPkr(paisa: number): string {
  const rs = Math.floor(paisa / 100);
  return `Rs. ${rs.toLocaleString('en-PK')}`;
}

export default function AdminCommissionsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'commissions' | 'milestones' | 'fraud'>('commissions');
  const [loading, setLoading] = useState<boolean>(true);

  // Tab 1: Referral Commissions
  const [commissions, setCommissions] = useState<any[]>([]);
  const [comPage, setComPage] = useState<number>(1);
  const [comTotalPages, setComTotalPages] = useState<number>(1);
  const [comTotal, setComTotal] = useState<number>(0);
  const [comStatus, setComStatus] = useState<string>('all');

  // Tab 2: Milestone Bonuses
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milePage, setMilePage] = useState<number>(1);
  const [mileTotalPages, setMileTotalPages] = useState<number>(1);
  const [mileTotal, setMileTotal] = useState<number>(0);

  // Tab 3: Fraud / Suspicious Referrals
  const [suspiciousList, setSuspiciousList] = useState<any[]>([]);

  // Reverse Referral Modal
  const [reverseId, setReverseId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');
  const [reversing, setReversing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await referralApi.adminGetReferrals({
        page: comPage,
        limit: 15,
        status: comStatus !== 'all' ? comStatus : undefined,
      });
      setCommissions(res.data || []);
      setComTotalPages(res.meta.totalPages);
      setComTotal(res.meta.total);
    } catch (err: any) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await referralApi.adminGetMilestones({
        page: milePage,
        limit: 15,
      });
      setMilestones(res.data || []);
      setMileTotalPages(res.meta.totalPages);
      setMileTotal(res.meta.total);
    } catch (err: any) {
      console.error('Failed to load milestone bonuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspicious = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSuspiciousReferrals();
      setSuspiciousList(res || []);
    } catch (err: any) {
      console.error('Failed to load suspicious referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'commissions') fetchCommissions();
    else if (activeTab === 'milestones') fetchMilestones();
    else if (activeTab === 'fraud') fetchSuspicious();
  }, [activeTab, comPage, comStatus, milePage]);

  const handleReverse = async () => {
    if (!reverseId || !reverseReason.trim()) return;
    try {
      setReversing(true);
      setActionError(null);
      await referralApi.adminReverseReferral(reverseId, reverseReason.trim());
      setActionSuccess('Referral relationship reversed and commission debited from ledger.');
      setReverseId(null);
      setReverseReason('');
      fetchCommissions();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reverse referral');
    } finally {
      setReversing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <DollarSign className="h-6 w-6 text-rose-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Commissions &amp; Milestone Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit direct referral commissions (Rs. 1,500), milestone bonuses (Rs. 15,000), reversals, and fraud checks.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (activeTab === 'commissions') fetchCommissions();
            else if (activeTab === 'milestones') fetchMilestones();
            else fetchSuspicious();
          }}
          disabled={loading}
          className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'commissions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Direct Commissions ({comTotal})
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'milestones'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Gift className="h-4 w-4" />
          10-Referral Milestone Bonuses ({mileTotal})
        </button>

        <button
          onClick={() => setActiveTab('fraud')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'fraud'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Suspicious Referral Alerts
          {suspiciousList.length > 0 && (
            <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
              {suspiciousList.length} Flagged
            </Badge>
          )}
        </button>
      </div>

      {/* Tab 1: Commissions Table */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Status Filter:</span>
              <select
                value={comStatus}
                onChange={(e) => {
                  setComStatus(e.target.value);
                  setComPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="commission_credited">Commission Credited</option>
                <option value="eligible">Eligible</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-800/60">
                <TableRow className="border-slate-800">
                  <TableHead className="text-xs text-slate-400">Referrer (Upline)</TableHead>
                  <TableHead className="text-xs text-slate-400">Referee (Joined)</TableHead>
                  <TableHead className="text-xs text-slate-400">Commission Amount</TableHead>
                  <TableHead className="text-xs text-slate-400">Status</TableHead>
                  <TableHead className="text-xs text-slate-400">Milestone Eligible</TableHead>
                  <TableHead className="text-xs text-slate-400">Registered</TableHead>
                  <TableHead className="text-xs text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-rose-400" />
                      Loading commission ledger...
                    </TableCell>
                  </TableRow>
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                      No referral commission records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((item: any) => (
                    <TableRow key={item._id} className="border-slate-800 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="font-semibold text-xs text-white">
                          {item.referrer?.name || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.referrer?.email || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-white">
                          {item.referee?.name || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.referee?.email || ''}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-400">
                        {formatPkr(item.commissionAmount || 150000)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === 'commission_credited'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                              : item.status === 'reversed'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                          }
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.isEligibleForMilestone ? (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status !== 'reversed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReverseId(item._id)}
                            className="h-7 text-xs px-2 text-rose-400 hover:text-white hover:bg-rose-600/20"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reverse
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page <span className="text-white font-semibold">{comPage}</span> of{' '}
                <span className="text-white font-semibold">{comTotalPages || 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={comPage <= 1 || loading}
                  onClick={() => setComPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={comPage >= comTotalPages || loading}
                  onClick={() => setComPage((p) => p + 1)}
                  className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Milestone Bonuses Table */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-800/60">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs text-slate-400">Achieving Leader</TableHead>
                <TableHead className="text-xs text-slate-400">Milestone Type</TableHead>
                <TableHead className="text-xs text-slate-400">Threshold</TableHead>
                <TableHead className="text-xs text-slate-400">Bonus Amount</TableHead>
                <TableHead className="text-xs text-slate-400">Status</TableHead>
                <TableHead className="text-xs text-slate-400">Achieved Date</TableHead>
                <TableHead className="text-xs text-slate-400 text-right">Credited Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading milestone achievements...
                  </TableCell>
                </TableRow>
              ) : milestones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                    No milestone achievements recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                milestones.map((m: any) => (
                  <TableRow key={m._id} className="border-slate-800 hover:bg-slate-800/40">
                    <TableCell>
                      <div className="font-semibold text-xs text-white">{m.user?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{m.user?.email}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-200 font-medium">
                      {m.milestoneType || '10_DIRECT_REFERRALS'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {m.threshold} Direct Referrals
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-indigo-400">
                      {formatPkr(m.bonusAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        {m.status?.toUpperCase() || 'CREDITED'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(m.achievedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono text-right">
                      {m.creditedAt ? new Date(m.creditedAt).toLocaleDateString() : 'Instant Ledger'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Milestone Pagination Bar */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="text-white font-semibold">{milePage}</span> of{' '}
              <span className="text-white font-semibold">{mileTotalPages || 1}</span> ({mileTotal} milestones)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={milePage <= 1 || loading}
                onClick={() => setMilePage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={milePage >= mileTotalPages || loading}
                onClick={() => setMilePage((p) => p + 1)}
                className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fraud / Suspicious Detection */}
      {activeTab === 'fraud' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Automated Referral Fraud Heuristics
            </h3>
            <p className="text-xs text-slate-400">
              Scans for shared IP addresses, rapid bursts of registrations, matching mobile numbers, and accounts referred by suspended actors.
            </p>
          </div>

          {suspiciousList.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="font-bold text-white text-sm">No suspicious referral clusters detected</div>
              <p className="mt-1">All current direct referral patterns comply with standard integrity rules.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                        {item.severity?.toUpperCase() || 'HIGH RISK'}
                      </Badge>
                      <h4 className="text-xs font-bold text-white">{item.type}</h4>
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    {item.details && (
                      <pre className="text-[10px] text-slate-400 font-mono mt-2 bg-slate-950 p-2 rounded">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reverse Referral Modal */}
      <Dialog open={!!reverseId} onOpenChange={() => setReverseId(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reverse Referral Commission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            {actionError && (
              <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300">
                {actionError}
              </div>
            )}
            <p className="text-slate-300">
              Reversing this referral relationship will mark the referral as <strong>REVERSED</strong>,
              remove it from milestone progress, and create an immutable <strong>REVERSAL</strong> debit
              entry in the referrer's wallet ledger.
            </p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason for Reversal (Required)</label>
              <Input
                placeholder="e.g. Fraudulent registration, duplicate account, chargeback..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReverseId(null)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReverse}
              disabled={!reverseReason.trim() || reversing}
              className="bg-rose-600 hover:bg-rose-500 text-xs text-white"
            >
              {reversing ? 'Reversing...' : 'Confirm Reversal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}