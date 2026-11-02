import React, { useEffect, useState } from 'react';
import { taskApi, type TaskSubmissionItem } from '../task.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminTaskSubmissionsPage(): React.ReactElement {
  const [submissions, setSubmissions] = useState<TaskSubmissionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewSub, setReviewSub] = useState<TaskSubmissionItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [page, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getSubmissionsAdmin({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setSubmissions(res.submissions);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load admin task submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!reviewSub) return;
    try {
      setActionLoading(true);
      setError(null);
      await taskApi.approveSubmission(reviewSub._id);
      setReviewSub(null);
      loadSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewSub) return;
    if (!rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await taskApi.rejectSubmission(reviewSub._id, rejectReason.trim());
      setReviewSub(null);
      loadSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Submissions Review</h1>
          <p className="text-sm text-muted-foreground">Inspect evidence screenshots, approve rewards to wallets, and moderate activities.</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
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
          <CardTitle className="text-lg">Submissions Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No submissions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Proof Type</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((s) => (
                    <tr key={s._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{s.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold line-clamp-1">{s.task?.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{s.task?.category?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="uppercase text-xs">{s.proofType}</Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(s.rewardAmount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={s.status === 'approved' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewSub(s);
                              setRejectReason('');
                              setIsRejecting(false);
                              setError(null);
                            }}
                          >
                            Review Evidence
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {s.reviewedBy ? `By ${s.reviewedBy.name}` : '-'}
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

      {/* Review Dialog */}
      <Dialog open={!!reviewSub} onOpenChange={(open) => !open && setReviewSub(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Task Completion Evidence</DialogTitle>
          </DialogHeader>

          {reviewSub && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <div>User: <strong>{reviewSub.user?.name}</strong> ({reviewSub.user?.email})</div>
                <div>Task: <strong>{reviewSub.task?.title}</strong></div>
                <div>Reward to Credit: <strong className="text-emerald-600 text-sm">{formatPKR(reviewSub.rewardAmount)}</strong></div>
                <div>Proof Type: <strong className="uppercase">{reviewSub.proofType}</strong></div>
              </div>

              {error && <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-700 border border-rose-200">{error}</div>}

              {/* Evidence Display */}
              <div className="p-4 border rounded-lg bg-card space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Submitted Evidence:</h4>

                {reviewSub.proofImageUrl && (
                  <div>
                    <a href={reviewSub.proofImageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={reviewSub.proofImageUrl}
                        alt="Task Proof"
                        className="max-h-60 rounded border object-contain mx-auto"
                      />
                    </a>
                    <p className="text-[11px] text-center text-muted-foreground mt-1">Click image to view full resolution in new tab</p>
                  </div>
                )}

                {reviewSub.proofUrl && (
                  <div className="p-2.5 bg-muted rounded flex items-center justify-between">
                    <span className="text-xs font-mono truncate max-w-sm">{reviewSub.proofUrl}</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href={reviewSub.proofUrl} target="_blank" rel="noreferrer">Open URL &rarr;</a>
                    </Button>
                  </div>
                )}

                {reviewSub.proofText && (
                  <div className="p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
                    {reviewSub.proofText}
                  </div>
                )}

                {reviewSub.notes && (
                  <div className="text-xs text-muted-foreground">
                    <strong>User Notes:</strong> {reviewSub.notes}
                  </div>
                )}
              </div>

              {isRejecting && (
                <div>
                  <label className="text-xs font-semibold text-rose-700">Rejection Reason *</label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Screenshot does not match task criteria or is blurred"
                    className="mt-1"
                  />
                </div>
              )}

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
                    <Button variant="destructive" onClick={() => setIsRejecting(true)}>Reject Submission...</Button>
                    <Button onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? 'Approving & Crediting...' : 'Approve & Credit Reward'}
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
