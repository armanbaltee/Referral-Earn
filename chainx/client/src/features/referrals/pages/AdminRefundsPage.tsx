import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { referralApi } from '../referral.api';

function formatPkr(paisa: number): string {
  const rs = Math.floor(paisa / 100);
  return `Rs. ${rs.toLocaleString('en-PK')}`;
}

export default function AdminRefundsPage(): React.ReactElement {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal Review
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [txRef, setTxRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await referralApi.adminGetRefunds({
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setRefunds(res.data || []);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error('Failed to load refund requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, statusFilter]);

  const openActionModal = (refund: any, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRefund(refund);
    setActionType(action);
    setNotes('');
    setTxRef('');
    setActionError(null);
  };

  const handleProcess = async () => {
    if (!selectedRefund || !actionType) return;
    try {
      setSubmitting(true);
      setActionError(null);
      await referralApi.adminProcessRefund(selectedRefund._id, {
        action: actionType,
        notes: notes.trim() || undefined,
        transactionReference: txRef.trim() || undefined,
      });
      setActionSuccess(`Refund request marked as ${actionType.toUpperCase()}.`);
      setSelectedRefund(null);
      setActionType(null);
      fetchRefunds();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to process refund request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <RotateCcw className="h-6 w-6 text-teal-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">100% Registration Fee Refunds</h1>
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">
              {total} Total Requests
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and execute 100% registration fee refunds unlocked by members who achieved 10 verified direct referrals.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchRefunds}
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

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span>Refund Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested (Awaiting Review)</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed / Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-800/60">
            <TableRow className="border-slate-800">
              <TableHead className="text-xs text-slate-400">User</TableHead>
              <TableHead className="text-xs text-slate-400">Fee Amount</TableHead>
              <TableHead className="text-xs text-slate-400">Qualifying Referrals</TableHead>
              <TableHead className="text-xs text-slate-400">Payout Method</TableHead>
              <TableHead className="text-xs text-slate-400">Status</TableHead>
              <TableHead className="text-xs text-slate-400">Requested Date</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-400" />
                  Loading refund requests...
                </TableCell>
              </TableRow>
            ) : refunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  No refund requests matching filters.
                </TableCell>
              </TableRow>
            ) : (
              refunds.map((ref: any) => (
                <TableRow key={ref._id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell>
                    <div className="font-semibold text-xs text-white">{ref.user?.name || 'User'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{ref.user?.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-400">
                    {formatPkr(ref.feeAmount || 1500000)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-white">
                      {ref.qualifyingReferralsCount ?? 10}
                    </span>
                    <span className="text-[11px] text-slate-400"> / 10 Verified</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {ref.payoutMethod?.toUpperCase() || 'WALLET_CREDIT'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ref.status === 'completed' || ref.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                          : ref.status === 'approved'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]'
                            : ref.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                      }
                    >
                      {ref.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {ref.requestedAt ? new Date(ref.requestedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ref.status === 'requested' || ref.status === 'under_review' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openActionModal(ref, 'approve')}
                            className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(ref, 'reject')}
                            className="h-7 text-xs px-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          >
                            Reject
                          </Button>
                        </>
                      ) : ref.status === 'approved' ? (
                        <Button
                          size="sm"
                          onClick={() => openActionModal(ref, 'complete')}
                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="text-white font-semibold">{page}</span> of{' '}
            <span className="text-white font-semibold">{totalPages || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Review / Process Modal */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              Process Refund Claim #{selectedRefund?._id.slice(-6)}
            </DialogTitle>
          </DialogHeader>

          {actionError && (
            <div className="p-3 my-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              {actionError}
            </div>
          )}

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Claimant:</span>
                <span className="text-white font-semibold">{selectedRefund?.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Refund Amount:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {formatPkr(selectedRefund?.feeAmount || 1500000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <Badge
                  className={
                    actionType === 'approve'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]'
                      : actionType === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                  }
                >
                  {actionType?.toUpperCase()}
                </Badge>
              </div>
            </div>

            {actionType === 'complete' && (
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Disbursement Transaction Reference / Slip ID (Required)
                </label>
                <Input
                  placeholder="e.g. EP-REF-998811 or Bank IBFT Ref"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">
                {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Verification Notes (Optional)'}
              </label>
              <Textarea
                rows={3}
                placeholder={
                  actionType === 'reject'
                    ? 'State why this refund was denied (e.g. invalid referral count, duplicate account)...'
                    : 'Internal notes regarding bank receipt or verification check...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActionType(null)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleProcess}
              disabled={
                submitting ||
                (actionType === 'reject' && !notes.trim()) ||
                (actionType === 'complete' && !txRef.trim())
              }
              className={
                actionType === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white text-xs'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white text-xs'
              }
            >
              {submitting ? 'Processing...' : `Confirm ${actionType?.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}