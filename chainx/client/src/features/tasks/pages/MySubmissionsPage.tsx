import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskApi, type TaskSubmissionItem } from '../task.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MySubmissionsPage(): React.ReactElement {
  const [submissions, setSubmissions] = useState<TaskSubmissionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [page, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getMySubmissions({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setSubmissions(res.submissions);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load my submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Task Submissions</h1>
          <p className="text-sm text-muted-foreground">Track verification progress, review feedback, and approved rewards.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/tasks">&larr; Back to Tasks</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s ? s.toUpperCase() : 'ALL SUBMISSIONS'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No submissions found.</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/tasks">Browse Daily Tasks</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Proof Type</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Feedback / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{sub.task?.title || 'Task'}</div>
                        <div className="text-xs text-muted-foreground capitalize">{sub.task?.category?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="uppercase text-xs">{sub.proofType}</Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(sub.rewardAmount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={sub.status === 'approved' ? 'success' : sub.status === 'pending' ? 'warning' : 'danger'}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate text-muted-foreground">
                        {sub.rejectionReason ? (
                          <span className="text-rose-600 font-medium">{sub.rejectionReason}</span>
                        ) : sub.proofImageUrl ? (
                          <a href={sub.proofImageUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            View Proof &rarr;
                          </a>
                        ) : sub.proofUrl ? (
                          <a href={sub.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            Open Link &rarr;
                          </a>
                        ) : (
                          sub.proofText || '-'
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
    </div>
  );
}
