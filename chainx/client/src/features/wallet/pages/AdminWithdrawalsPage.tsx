import React, { useEffect, useState } from 'react';
import { walletApi, type WithdrawalItem } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminWithdrawalsPage(): React.ReactElement {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review & completion modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [gatewayTxId, setGatewayTxId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'approve' | 'complete' | 'reject'>('approve');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, [page, statusFilter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await walletApi.getWithdrawalsAdmin({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setWithdrawals(res.withdrawals);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load admin withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    setError(null);
    try {
      setActionLoading(true);
      if (mode === 'approve') {
        await walletApi.approveWithdrawal(selectedWithdrawal._id, {
          adminNotes: adminNotes.trim() || undefined,
        });
      } else if (mode === 'complete') {
        await walletApi.completeWithdrawal(selectedWithdrawal._id, {
          gatewayTransactionId: gatewayTxId.trim() || undefined,
          adminNotes: adminNotes.trim() || undefined,
        });
      } else if (mode === 'reject') {
        if (!rejectReason.trim()) {
          setError('A rejection reason is required.');
          setActionLoading(false);
          return;
        }
        await walletApi.rejectWithdrawal(selectedWithdrawal._id, {
          reason: rejectReason.trim(),
          adminNotes: adminNotes.trim() || undefined,
        });
      }
      setSelectedWithdrawal(null);
      loadWithdrawals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdrawal Payout Queue</h1>
          <p className="text-sm text-muted-foreground">Manage withdrawal authorization, mobile wallet payouts, and fund releases.</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'completed', 'rejected', ''].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s ? s.toUpperCase() : 'ALL'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No withdrawals found for this status.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Recipient Account</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{w.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{w.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-xs">{w.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold">{w.accountTitle}</div>
                        <div className="text-xs font-mono text-muted-foreground">{w.accountNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">{formatPKR(w.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={w.status === 'completed' ? 'success' : w.status === 'rejected' || w.status === 'failed' ? 'danger' : 'warning'}>
                          {w.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {w.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setMode('approve');
                                setError(null);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setMode('reject');
                                setError(null);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setMode('complete');
                              setGatewayTxId('');
                              setError(null);
                            }}
                          >
                            Mark Paid & Complete
                          </Button>
                        )}
                        {w.status === 'completed' && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {w.gatewayTransactionId ? `TID: ${w.gatewayTransactionId}` : 'Paid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages || 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'approve' && 'Approve Withdrawal Request'}
              {mode === 'complete' && 'Complete Payout (Finalize Debit)'}
              {mode === 'reject' && 'Reject Withdrawal (Release Funds)'}
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <div>User: <strong>{selectedWithdrawal.user?.name}</strong></div>
                <div>Amount: <strong className="text-rose-600 text-sm">{formatPKR(selectedWithdrawal.amount)}</strong></div>
                <div>Method: <strong className="uppercase">{selectedWithdrawal.paymentMethod}</strong></div>
                <div>Account: <strong>{selectedWithdrawal.accountTitle} ({selectedWithdrawal.accountNumber})</strong></div>
              </div>

              {error && <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-700 border border-rose-200">{error}</div>}

              {mode === 'complete' && (
                <div>
                  <label className="text-xs font-semibold">Payment Gateway / SMS Transaction ID</label>
                  <Input
                    value={gatewayTxId}
                    onChange={(e) => setGatewayTxId(e.target.value)}
                    placeholder="e.g. 01847192847"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This finalizes the pending debit and permanently marks payout as complete.</p>
                </div>
              )}

              {mode === 'reject' && (
                <div>
                  <label className="text-xs font-semibold text-rose-700">Rejection Reason *</label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Account name mismatch or invalid number"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Reserved funds will be automatically released back to the user's available balance.</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium">Internal Notes</label>
                <Input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedWithdrawal(null)}>Cancel</Button>
                <Button
                  variant={mode === 'reject' ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${mode.toUpperCase()}`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
