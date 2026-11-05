import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Pin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { adminApi, type AnnouncementItem } from '../../dashboard/admin.api';

export default function AdminAnnouncementsPage(): React.ReactElement {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formPriority, setFormPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formRoles, setFormRoles] = useState<string[]>(['user']);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAnnouncementsAdmin({
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setAnnouncements(res.announcements || []);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormPriority('normal');
    setFormStatus('published');
    setFormIsPinned(false);
    setFormRoles(['user']);
    setActionError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormIsPinned(item.isPinned);
    setFormRoles(item.targetRoles || ['user']);
    setActionError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setActionError('Title and message content are required.');
      return;
    }

    try {
      setSaving(true);
      setActionError(null);
      if (editingItem) {
        await adminApi.updateAnnouncement(editingItem._id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          priority: formPriority,
          status: formStatus,
          isPinned: formIsPinned,
          targetRoles: formRoles,
        });
      } else {
        await adminApi.createAnnouncement({
          title: formTitle.trim(),
          content: formContent.trim(),
          priority: formPriority,
          status: formStatus,
          isPinned: formIsPinned,
          targetRoles: formRoles,
        });
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await adminApi.deleteAnnouncement(deleteId);
      setDeleteId(null);
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
    } finally {
      setDeleting(false);
    }
  };

  const toggleRole = (role: string) => {
    if (formRoles.includes(role)) {
      if (formRoles.length > 1) {
        setFormRoles(formRoles.filter((r) => r !== role));
      }
    } else {
      setFormRoles([...formRoles, role]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Announcements &amp; Broadcasts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish platform news, maintenance notices, and important system alerts directly to members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnnouncements}
            disabled={loading}
            className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-800/60">
            <TableRow className="border-slate-800">
              <TableHead className="text-xs text-slate-400">Title</TableHead>
              <TableHead className="text-xs text-slate-400">Priority</TableHead>
              <TableHead className="text-xs text-slate-400">Target Audience</TableHead>
              <TableHead className="text-xs text-slate-400">Status</TableHead>
              <TableHead className="text-xs text-slate-400">Pinned</TableHead>
              <TableHead className="text-xs text-slate-400">Published Date</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-purple-400" />
                  Loading announcements...
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  No announcements found. Click "New Announcement" to broadcast to users.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((a) => (
                <TableRow key={a._id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell>
                    <div className="font-semibold text-xs text-white max-w-sm truncate">{a.title}</div>
                    <div className="text-[11px] text-slate-400 max-w-sm line-clamp-1">{a.content}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        a.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                          : a.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 text-[10px]'
                      }
                    >
                      {a.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {a.targetRoles?.join(', ') || 'All Roles'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        a.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                          : a.status === 'draft'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 text-[10px]'
                      }
                    >
                      {a.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.isPinned ? (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'Unpublished'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(a)}
                        className="h-7 text-xs px-2 text-slate-300 hover:text-white"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(a._id)}
                        className="h-7 text-xs px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" />
                {editingItem ? 'Edit Announcement' : 'Create Platform Announcement'}
              </DialogTitle>
            </DialogHeader>

            {actionError && (
              <div className="p-3 my-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Title</label>
                <Input
                  placeholder="e.g. System Maintenance Notice / Ramadan Bonus Promotion"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Message Content</label>
                <Textarea
                  placeholder="Details of the announcement displayed to users..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e: any) => setFormPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    <option value="published">Published Immediately</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Pinned & Roles */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="isPinned" className="text-xs text-slate-200 cursor-pointer">
                    Pin to top of member dashboards
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Target Roles:</span>
                  <div className="flex items-center gap-3">
                    {['user', 'admin', 'super_admin'].map((role) => (
                      <label key={role} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs text-slate-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
              >
                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Announcement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400">Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-300 py-2">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteId(null)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-500 text-xs text-white"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
