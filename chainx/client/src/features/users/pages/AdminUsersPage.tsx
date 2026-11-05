import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  ShieldAlert,
  RefreshCw,
  UserCheck,
  UserX,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { adminApi, type AdminUserItem } from '../../dashboard/admin.api';

export default function AdminUsersPage(): React.ReactElement {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Selected user for modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Suspension / Action state
  const [suspendModalOpen, setSuspendModalOpen] = useState<boolean>(false);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirm payment state
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState<boolean>(false);
  const [paymentTxId, setPaymentTxId] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        accountStatus: statusFilter !== 'all' ? statusFilter : undefined,
        registrationPaymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
      });
      setUsers(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenDetails = async (user: AdminUserItem) => {
    setIsDetailOpen(true);
    setDetailsLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const full = await adminApi.getUserDetails(user._id);
      setSelectedUser(full);
    } catch {
      setSelectedUser(user);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await adminApi.suspendUser(selectedUser._id, suspendReason);
      setActionSuccess('Account suspended successfully.');
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchUsers();
      const updated = await adminApi.getUserDetails(selectedUser._id);
      setSelectedUser(updated);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await adminApi.reactivateUser(selectedUser._id);
      setActionSuccess('Account reactivated successfully.');
      fetchUsers();
      const updated = await adminApi.getUserDetails(selectedUser._id);
      setSelectedUser(updated);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedUser || !paymentTxId.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await adminApi.confirmRegistrationPayment(selectedUser._id, {
        transactionId: paymentTxId.trim(),
        notes: paymentNotes.trim() || undefined,
      });
      setActionSuccess('Registration fee confirmed & verified!');
      setConfirmPaymentModalOpen(false);
      setPaymentTxId('');
      setPaymentNotes('');
      fetchUsers();
      const updated = await adminApi.getUserDetails(selectedUser._id);
      setSelectedUser(updated);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
              {total} Total Users
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect KYC & registration status, manage account access, and audit activities.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchUsers()}
          disabled={loading}
          className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by name, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Fee:</span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Fees</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Under Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-800/60">
            <TableRow className="border-slate-800">
              <TableHead className="text-xs text-slate-400">User</TableHead>
              <TableHead className="text-xs text-slate-400">Phone</TableHead>
              <TableHead className="text-xs text-slate-400">Role</TableHead>
              <TableHead className="text-xs text-slate-400">Account Status</TableHead>
              <TableHead className="text-xs text-slate-400">Registration Fee</TableHead>
              <TableHead className="text-xs text-slate-400">Referral Code</TableHead>
              <TableHead className="text-xs text-slate-400">Joined</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-400" />
                  Loading user records...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-500">
                  No users found matching query.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u._id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 font-mono">
                    {u.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.role === 'admin' || u.role === 'super_admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 text-[10px]'
                      }
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.accountStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                          : u.accountStatus === 'suspended'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                      }
                    >
                      {u.accountStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.registrationPaymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                          : u.registrationPaymentStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 text-[10px]'
                      }
                    >
                      {u.registrationPaymentStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 font-mono">
                    {u.referralCode}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDetails(u)}
                      className="h-7 text-xs px-2.5 text-blue-400 hover:text-white hover:bg-blue-600/20"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="text-white font-semibold">{page}</span> of{' '}
            <span className="text-white font-semibold">{totalPages || 1}</span> ({total} users)
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

      {/* User Details Modal / Drawer */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              User Profile &amp; Control
            </DialogTitle>
          </DialogHeader>

          {detailsLoading || !selectedUser ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
              Loading complete profile &amp; security data...
            </div>
          ) : (
            <div className="space-y-5">
              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                  {actionError}
                </div>
              )}

              {/* Identity & Badges */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-base text-blue-400">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Phone: {selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge
                    className={
                      selectedUser.accountStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                        : selectedUser.accountStatus === 'suspended'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                    }
                  >
                    STATUS: {selectedUser.accountStatus.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {selectedUser._id}
                  </span>
                </div>
              </div>

              {/* Financial & Referral Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Registration Fee Status</div>
                  <div className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                    <Badge
                      className={
                        selectedUser.registrationPaymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                      }
                    >
                      {selectedUser.registrationPaymentStatus.toUpperCase()}
                    </Badge>
                    {selectedUser.registrationPaymentStatus !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => setConfirmPaymentModalOpen(true)}
                        className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Verify / Activate
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Referral Info</div>
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    Code: <span className="text-blue-400 font-bold">{selectedUser.referralCode}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Direct Referrals: {selectedUser.stats?.directReferralsCount ?? 0}
                  </div>
                  {selectedUser.referredBy && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Referred by: {selectedUser.referredBy.name} ({selectedUser.referredBy.referralCode})
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Administrative Controls
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedUser.accountStatus === 'suspended' ? (
                    <Button
                      size="sm"
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Reactivate Account
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSuspendModalOpen(true)}
                      disabled={actionLoading}
                      variant="outline"
                      className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs"
                    >
                      <UserX className="h-3.5 w-3.5 mr-1.5" />
                      Suspend Account
                    </Button>
                  )}
                </div>
              </div>

              {/* User Specific Audit History */}
              {selectedUser.auditHistory && selectedUser.auditHistory.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Recent Account Audit Events
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedUser.auditHistory.map((item: any) => (
                      <div
                        key={item._id}
                        className="text-[11px] flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800"
                      >
                        <span className="font-semibold text-slate-300">{item.action}</span>
                        <span className="text-slate-400 truncate max-w-xs">{item.description}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Suspend User Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-300">
              Are you sure you want to suspend{' '}
              <strong className="text-white">{selectedUser?.name}</strong>? They will immediately lose
              access to the portal, withdrawals, and task submissions.
            </p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason for suspension (Required)</label>
              <Input
                placeholder="e.g. Terms violation, fraudulent referrals, suspicious KYC..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSuspendModalOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSuspend}
              disabled={!suspendReason.trim() || actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-xs text-white"
            >
              {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Confirm Payment Modal */}
      <Dialog open={confirmPaymentModalOpen} onOpenChange={setConfirmPaymentModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Confirm Registration Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-300">
              Verify and mark registration fee as paid for{' '}
              <strong className="text-white">{selectedUser?.name}</strong>. This will activate their
              account and credit eligible referral uplines.
            </p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Transaction Reference / ID (Required)</label>
              <Input
                placeholder="e.g. EP-99881122 or JC-771199"
                value={paymentTxId}
                onChange={(e) => setPaymentTxId(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Admin Verification Notes (Optional)</label>
              <Input
                placeholder="e.g. Bank statement verified on 2026-11-05"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmPaymentModalOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPayment}
              disabled={!paymentTxId.trim() || actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
            >
              {actionLoading ? 'Confirming...' : 'Approve & Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}