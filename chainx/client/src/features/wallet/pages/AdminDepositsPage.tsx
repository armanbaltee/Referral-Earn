import React, { useEffect, useState } from 'react';
import { walletApi, type DepositItem } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminDepositsPage(): React.ReactElement {
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review dialog state
  const [reviewDeposit, setReviewDeposit] = useState<DepositItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeposits();
  }, [page, statusFilter]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const res = await walletApi.getDepositsAdmin({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setDeposits(res.deposits);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load admin deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!reviewDeposit) return;
    try {
      setActionLoading(true);
      setError(null);
      await walletApi.approveDeposit(reviewDeposit._id, {
        adminNotes: adminNotes.trim() || undefined,
      });
      setReviewDeposit(null);
      loadDeposits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewDeposit) return;
    if (!rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await walletApi.rejectDeposit(reviewDeposit._id, {
        reason: rejectReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      });
      setReviewDeposit(null);
      loadDeposits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposit Verification Queue</h1>
          <p className="text-sm text-muted-foreground">Verify manual Easypaisa & JazzCash transfers and credit user wallets.</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'completed', 'rejected', ''].map((s) => (
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
          <CardTitle className="text-lg">Deposits List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No deposits found for this status.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">TRX ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Proof</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deposits.map((d) => (
                    <tr key={d._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{d.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{d.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-xs">{d.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-xs">{d.paymentReference}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(d.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={d.status === 'completed' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {d.proofImageUrl ? (
                          <a href={d.proofImageUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                            View Receipt &rarr;
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {d.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewDeposit(d);
                              setAdminNotes('');
                              setRejectReason('');
                              setIsRejecting(false);
                              setError(null);
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {d.reviewedBy ? `Reviewed by ${d.reviewedBy.name}` : '-'}
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

      {/* Review / Approval Dialog */}
      <Dialog open={!!reviewDeposit} onOpenChange={(open) => !open && setReviewDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Verification Review</DialogTitle>
          </DialogHeader>
          {reviewDeposit && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded text-xs space-y-1.5">
                <div>User: <strong>{reviewDeposit.user?.name}</strong> ({reviewDeposit.user?.email})</div>
                <div>Amount: <strong className="text-emerald-600 text-sm">{formatPKR(reviewDeposit.amount)}</strong></div>
                <div>Method: <strong className="uppercase">{reviewDeposit.paymentMethod}</strong></div>
                <div>TRX Reference: <strong className="font-mono">{reviewDeposit.paymentReference}</strong></div>
                {reviewDeposit.senderNotes && <div>User Notes: <em>{reviewDeposit.senderNotes}</em></div>}
                {reviewDeposit.proofImageUrl && (
                  <div className="pt-2">
                    <a href={reviewDeposit.proofImageUrl} target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                      Open Uploaded Proof Image &rarr;
                    </a>
                  </div>
                )}
              </div>

              {error && <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-700 border border-rose-200">{error}</div>}

              {isRejecting ? (
                <div>
                  <label className="text-xs font-semibold text-rose-700">Rejection Reason *</label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. TRX reference invalid or not found in merchant SMS."
                    className="mt-1"
                  />
                </div>
              ) : null}

              <div>
                <label className="text-xs font-medium">Internal Admin Notes</label>
                <Input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional internal verification note"
                  className="mt-1"
                />
              </div>

              <DialogFooter className="flex justify-between items-center w-full">
                {isRejecting ? (
                  <>
                    <Button variant="ghost" onClick={() => setIsRejecting(false)}>Back</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                      {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" onClick={() => setIsRejecting(true)}>Reject...</Button>
                    <Button onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? 'Approving & Crediting...' : 'Approve & Credit Wallet'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
