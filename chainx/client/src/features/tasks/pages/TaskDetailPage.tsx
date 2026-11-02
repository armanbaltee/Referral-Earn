import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskApi, type TaskItem, ProofType } from '../task.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TaskDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskItem | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form submission state
  const [proofText, setProofText] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getTaskById(id!);
      setTask(data.task);
      setUserStats(data.userStats);
    } catch (err: any) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setError(null);
    setSuccess(null);

    // Validate based on proof type
    if (task.requiredProofType === ProofType.SCREENSHOT && !proofImageUrl.trim()) {
      setError('Please provide the hosted screenshot URL as proof of completion.');
      return;
    }
    if (task.requiredProofType === ProofType.TEXT && !proofText.trim()) {
      setError('Please enter the required text response / code / survey answer.');
      return;
    }
    if ((task.requiredProofType === ProofType.EXTERNAL_URL || task.requiredProofType === ProofType.VIDEO_URL) && !proofUrl.trim()) {
      setError('Please provide the valid URL link as proof.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await taskApi.submitTask(task._id, {
        proofType: task.requiredProofType,
        proofText: proofText.trim() || undefined,
        proofImageUrl: proofImageUrl.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(res.message);
      // Refresh task user stats
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">Task Not Found</h2>
        <Button asChild className="mt-4">
          <Link to="/tasks">Back to Task Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
        &larr; Back to Task Marketplace
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Task Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            {task.thumbnail && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                <img src={task.thumbnail} alt={task.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{task.category.replace('_', ' ')}</Badge>
                <Badge variant="outline">Required Proof: {task.requiredProofType.toUpperCase()}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Est. {task.estimatedMinutes} mins</span>
              </div>
              <CardTitle className="text-xl font-bold mt-2">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">About This Task</h3>
                <p className="text-sm mt-1 leading-relaxed text-foreground/90 whitespace-pre-line">{task.description}</p>
              </div>

              {task.videoUrl && (
                <div className="pt-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Video Activity Link</h3>
                  <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                    <span className="text-xs truncate max-w-xs font-mono">{task.videoUrl}</span>
                    <Button size="sm" asChild>
                      <a href={task.videoUrl} target="_blank" rel="noreferrer">Open Video &rarr;</a>
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Step-by-Step Instructions</h3>
                <div className="mt-2 text-sm leading-relaxed p-4 bg-muted/40 rounded-lg whitespace-pre-line border">
                  {task.instructions}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Completion Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}
              {success && <div className="mb-4 rounded bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</div>}

              {userStats?.hasPendingSubmission ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <strong>Submission Under Review:</strong> You already have a pending verification submission for this task. You will be notified once reviewed.
                </div>
              ) : !userStats?.canSubmit ? (
                <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm">
                  You have already completed the maximum allowed submissions ({task.maxCompletionsPerUser}) for this task.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {task.requiredProofType === ProofType.SCREENSHOT && (
                    <div>
                      <Label htmlFor="screenshot">Screenshot Image URL (Cloudinary / Direct Link) *</Label>
                      <Input
                        id="screenshot"
                        type="url"
                        value={proofImageUrl}
                        onChange={(e) => setProofImageUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/.../proof.png"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">Upload screenshot of completed activity and paste the URL link here.</p>
                    </div>
                  )}

                  {task.requiredProofType === ProofType.TEXT && (
                    <div>
                      <Label htmlFor="ptext">Text Evidence / Code / Survey Response *</Label>
                      <textarea
                        id="ptext"
                        rows={3}
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        placeholder="Provide details or paste the confirmation code..."
                        className="w-full mt-1.5 p-2.5 rounded-md border text-sm bg-background"
                        required
                      />
                    </div>
                  )}

                  {(task.requiredProofType === ProofType.EXTERNAL_URL || task.requiredProofType === ProofType.VIDEO_URL) && (
                    <div>
                      <Label htmlFor="purl">Post / Profile / Video Link *</Label>
                      <Input
                        id="purl"
                        type="url"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="https://instagram.com/p/... or https://youtube.com/..."
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="user-notes">Additional Notes for Moderator (Optional)</Label>
                    <Input
                      id="user-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Account username used during review..."
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Submitting Evidence...' : 'Submit Evidence for Verification'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Reward Upon Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600">{formatPKR(task.rewardAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">Directly credited to available balance upon verification.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Task Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div><strong>Max Completions:</strong> {task.maxCompletionsPerUser} per user</div>
              <div><strong>Your Completed:</strong> {userStats?.userCompletions || 0} times</div>
              {task.endDate && (
                <div><strong>Deadline:</strong> {new Date(task.endDate).toLocaleDateString()}</div>
              )}
              <div className="pt-2 border-t text-[11px] leading-relaxed">
                Fraudulent, fake, or blurred screenshots will result in immediate rejection and potential account penalties.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

