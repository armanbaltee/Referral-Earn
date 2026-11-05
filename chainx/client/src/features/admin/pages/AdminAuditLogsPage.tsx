import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { adminApi } from '../../dashboard/admin.api';

export default function AdminAuditLogsPage(): React.ReactElement {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs({
        page,
        limit: 20,
        search: search.trim() || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      setLogs(res.data || []);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">System Audit Logs</h1>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
              Immutable Trail ({total} Events)
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-proof chronological trail of all security changes, admin approvals, financial ledger actions, and status updates.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchLogs}
          disabled={loading}
          className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search description, IP, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-400 w-full md:w-auto">
          <Filter className="h-3.5 w-3.5" />
          <span>Action Category:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="ADMIN_UPDATE_SETTINGS">Settings Changes</option>
            <option value="USER_SUSPENDED">User Suspensions</option>
            <option value="USER_REACTIVATED">User Reactivations</option>
            <option value="DEPOSIT_APPROVED">Deposits Approved</option>
            <option value="DEPOSIT_REJECTED">Deposits Rejected</option>
            <option value="WITHDRAWAL_APPROVED">Withdrawals Approved</option>
            <option value="WITHDRAWAL_COMPLETED">Withdrawals Completed</option>
            <option value="WITHDRAWAL_REJECTED">Withdrawals Rejected</option>
            <option value="COMMISSION_CREDITED">Commissions</option>
            <option value="MILESTONE_ACHIEVED">Milestone Bonuses</option>
            <option value="TASK_APPROVED">Task Submissions Approved</option>
            <option value="FEE_REFUND_APPROVED">Fee Refunds</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-800/60">
            <TableRow className="border-slate-800">
              <TableHead className="text-xs text-slate-400">Log ID</TableHead>
              <TableHead className="text-xs text-slate-400">Action</TableHead>
              <TableHead className="text-xs text-slate-400">Actor</TableHead>
              <TableHead className="text-xs text-slate-400">Description</TableHead>
              <TableHead className="text-xs text-slate-400">IP / Target</TableHead>
              <TableHead className="text-xs text-slate-400">Timestamp</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading audit stream...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-500">
                  No audit log entries matching filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-400">
                    #{log._id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-200">
                      {log.actor?.name || 'System / Service'}
                    </div>
                    {log.actor?.email && (
                      <div className="text-[10px] text-slate-500 font-mono">{log.actor.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 max-w-sm truncate">
                    {log.description}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono text-[11px]">
                    {log.ipAddress || (log.target ? `Target: #${log.target.slice(-6)}` : 'Internal')}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 text-xs px-2 text-blue-400 hover:text-white"
                    >
                      Inspect
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
            Page <span className="text-white font-semibold">{page}</span> of{' '}
            <span className="text-white font-semibold">{totalPages || 1}</span> ({total} logs)
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

      {/* Inspect Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              Audit Log Detail #{selectedLog?._id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Action:</span>
                  <Badge className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px]">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200 font-mono">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actor:</span>
                  <span className="text-slate-200 font-semibold">{selectedLog.actor?.name || 'System'}</span>
                </div>
                {selectedLog.ipAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="text-slate-200 font-mono">{selectedLog.ipAddress}</span>
                  </div>
                )}
                {selectedLog.target && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Resource:</span>
                    <span className="text-slate-200 font-mono">{selectedLog.target}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">Description:</span>
                <p className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Metadata Payload:</span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}