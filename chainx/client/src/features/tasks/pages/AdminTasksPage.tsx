import React, { useEffect, useState } from 'react';
import { taskApi, type TaskItem, TaskCategory, TaskStatus, ProofType } from '../task.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminTasksPage(): React.ReactElement {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [overview, setOverview] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.COMPLETE_TASK);
  const [rewardPKR, setRewardPKR] = useState('50');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [maxCompletionsPerUser, setMaxCompletionsPerUser] = useState('1');
  const [requiredProofType, setRequiredProofType] = useState<ProofType>(ProofType.SCREENSHOT);
  const [thumbnail, setThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PUBLISHED);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, ov] = await Promise.all([
        taskApi.getAllTasksAdmin({ page, limit: 15, status: statusFilter || undefined }),
        taskApi.getOverview(),
      ]);
      setTasks(res.tasks);
      setTotalPages(res.meta.totalPages);
      setOverview(ov);
    } catch (err) {
      console.error('Failed to load admin tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setInstructions('');
    setCategory(TaskCategory.COMPLETE_TASK);
    setRewardPKR('50');
    setMaxParticipants('100');
    setMaxCompletionsPerUser('1');
    setRequiredProofType(ProofType.SCREENSHOT);
    setThumbnail('');
    setVideoUrl('');
    setStatus(TaskStatus.PUBLISHED);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setInstructions(task.instructions);
    setCategory(task.category);
    setRewardPKR(String(task.rewardAmount / 100));
    setMaxParticipants(String(task.maxParticipants || 100));
    setMaxCompletionsPerUser(String(task.maxCompletionsPerUser || 1));
    setRequiredProofType(task.requiredProofType);
    setThumbnail(task.thumbnail || '');
    setVideoUrl(task.videoUrl || '');
    setStatus(task.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const rewardNum = parseFloat(rewardPKR);
    if (isNaN(rewardNum) || rewardNum <= 0) {
      setFormError('Reward amount must be a positive number.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      category,
      rewardAmount: Math.round(rewardNum * 100),
      maxParticipants: parseInt(maxParticipants) || 100,
      maxCompletionsPerUser: parseInt(maxCompletionsPerUser) || 1,
      requiredProofType,
      thumbnail: thumbnail.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      status,
    };

    try {
      setSaving(true);
      if (editingTask) {
        await taskApi.updateTask(editingTask._id, payload);
      } else {
        await taskApi.createTask(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Task Management & Budgets</h1>
          <p className="text-sm text-muted-foreground">Author sponsored activities, monitor reward budget burn rates, and manage task lifecycles.</p>
        </div>
        <Button onClick={openCreateModal}>+ Create New Task</Button>
      </div>

      {/* Task Budget Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Budget Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatPKR(overview?.stats?.totalBudgetAllocated || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800">Total Rewards Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">{formatPKR(overview?.stats?.totalRewardsPaid || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800">Remaining Pool Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-700">{formatPKR(overview?.stats?.totalRemainingBudget || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Approved Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{overview?.stats?.totalCompletions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['', 'published', 'draft', 'paused', 'completed'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s ? s.toUpperCase() : 'ALL TASKS'}
          </Button>
        ))}
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Proof Type</th>
                    <th className="py-3 px-4">Budget / Remaining</th>
                    <th className="py-3 px-4">Completions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((t) => (
                    <tr key={t._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold line-clamp-1">{t.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{t.category.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(t.rewardAmount)}</td>
                      <td className="py-3 px-4 uppercase text-xs font-mono">{t.requiredProofType}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold">{formatPKR(t.remainingBudget)} left</div>
                        <div className="text-[11px] text-muted-foreground">of {formatPKR(t.totalBudget)}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {t.completionsCount} / {t.maxParticipants || '∞'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={t.status === 'published' ? 'success' : t.status === 'draft' ? 'secondary' : 'warning'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(t)}>
                          Edit
                        </Button>
                        {t.status === 'published' ? (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(t._id, TaskStatus.PAUSED)}>
                            Pause
                          </Button>
                        ) : t.status === 'paused' || t.status === 'draft' ? (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(t._id, TaskStatus.PUBLISHED)}>
                            Publish
                          </Button>
                        ) : null}
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

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Sponsored Task'}</DialogTitle>
          </DialogHeader>

          {formError && <div className="p-3 bg-rose-50 text-xs text-rose-700 rounded border border-rose-200">{formError}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="t-title">Task Title *</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full mt-1.5 p-2 rounded-md border text-sm bg-background"
                >
                  <option value={TaskCategory.WATCH_VIDEO}>Watch Video</option>
                  <option value={TaskCategory.COMPLETE_TASK}>Assigned Task</option>
                  <option value={TaskCategory.PROMOTIONAL}>Promotional Activity</option>
                  <option value={TaskCategory.PRODUCT_RELATED}>Product Activity</option>
                  <option value={TaskCategory.OTHER}>Other Activity</option>
                </select>
              </div>

              <div>
                <Label>Required Proof Type *</Label>
                <select
                  value={requiredProofType}
                  onChange={(e) => setRequiredProofType(e.target.value as ProofType)}
                  className="w-full mt-1.5 p-2 rounded-md border text-sm bg-background"
                >
                  <option value={ProofType.SCREENSHOT}>Screenshot Upload</option>
                  <option value={ProofType.TEXT}>Text Response</option>
                  <option value={ProofType.EXTERNAL_URL}>External URL Link</option>
                  <option value={ProofType.VIDEO_URL}>Video Proof URL</option>
                  <option value={ProofType.OTHER}>Other Proof</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="t-reward">Reward (PKR) *</Label>
                <Input
                  id="t-reward"
                  type="number"
                  min="1"
                  value={rewardPKR}
                  onChange={(e) => setRewardPKR(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="t-max">Max Participants</Label>
                <Input
                  id="t-max"
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="t-limit">Per-User Limit</Label>
                <Input
                  id="t-limit"
                  type="number"
                  min="1"
                  value={maxCompletionsPerUser}
                  onChange={(e) => setMaxCompletionsPerUser(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="t-desc">Short Description *</Label>
              <textarea
                id="t-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1.5 p-2 rounded-md border text-sm bg-background"
                required
              />
            </div>

            <div>
              <Label htmlFor="t-inst">Step-by-Step Instructions *</Label>
              <textarea
                id="t-inst"
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full mt-1.5 p-2 rounded-md border text-sm bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-thumb">Thumbnail URL (Optional)</Label>
                <Input id="t-thumb" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="t-vid">Video URL (Optional)</Label>
                <Input id="t-vid" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Publication Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full mt-1.5 p-2 rounded-md border text-sm bg-background"
              >
                <option value={TaskStatus.PUBLISHED}>Published (Live for users)</option>
                <option value={TaskStatus.DRAFT}>Draft (Hidden)</option>
                <option value={TaskStatus.PAUSED}>Paused</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create & Allocate Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
