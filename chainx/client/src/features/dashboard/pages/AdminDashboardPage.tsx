import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  ShoppingBag,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  CheckSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { adminApi, type AdminDashboardOverviewData } from '../admin.api';

function formatPkr(paisa: number): string {
  const rs = Math.floor(paisa / 100);
  return `Rs. ${rs.toLocaleString('en-PK')}`;
}

export default function AdminDashboardPage(): React.ReactElement {
  const [data, setData] = useState<AdminDashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getDashboardOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = data?.kpis;
  const platformChart = data?.platformChart && data.platformChart.length > 0 ? data.platformChart : [
    { month: 'Month 1', deposits: 0, withdrawals: 0, commissions: 0 },
    { month: 'Month 2', deposits: 0, withdrawals: 0, commissions: 0 },
  ];
  const pendingActions = data?.pendingActions || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Administration
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
              System Live
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics for users, financial ledger, withdrawals, commissions, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchOverview}
            disabled={loading}
            className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/withdrawals">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
              Pending Withdrawals ({kpis?.pendingWithdrawalsCount ?? 0})
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Export Reports
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchOverview} className="text-xs text-rose-300 hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Primary Platform KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? '...' : (kpis?.totalUsers ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            Active: {kpis?.activeUsers ?? 0} • Pending: {kpis?.pendingUsers ?? 0}
          </div>
        </div>

        {/* Verified Registration Payments */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verified Registrations
            </span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? '...' : formatPkr(kpis?.verifiedRegistrationPaymentsPaisa ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Separated from user withdrawable wallet
          </div>
        </div>

        {/* Product Sales */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product Sales
            </span>
            <ShoppingBag className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? '...' : formatPkr(kpis?.totalProductSalesPaisa ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {kpis?.totalOrdersCount ?? 0} total paid orders
          </div>
        </div>

        {/* Referral Commissions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Referral Commissions
            </span>
            <DollarSign className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {loading ? '...' : formatPkr(kpis?.totalReferralCommissionsPaisa ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Milestone Bonuses: {formatPkr(kpis?.totalMilestoneBonusesPaisa ?? 0)}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Withdrawals
            </span>
            <ArrowUpCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {loading ? '...' : `${kpis?.pendingWithdrawalsCount ?? 0} reqs`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Volume: {formatPkr(kpis?.pendingWithdrawalsPaisa ?? 0)}
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Deposits
            </span>
            <ArrowDownCircle className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">
            {loading ? '...' : `${kpis?.pendingDepositsCount ?? 0} receipts`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Volume: {formatPkr(kpis?.pendingDepositsPaisa ?? 0)}
          </div>
        </div>

        {/* Refund Requests (10-Referral Milestone) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fee Refund Claims
            </span>
            <RotateCcw className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {loading ? '...' : `${kpis?.pendingRefundsCount ?? 0} Pending`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            10-referral milestone 100% refund queue
          </div>
        </div>

        {/* Tasks & Submissions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tasks & Submissions
            </span>
            <CheckSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {loading ? '...' : `${kpis?.pendingTaskSubmissionsCount ?? 0} Pending`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active Tasks: {kpis?.activeTasksCount ?? 0}
          </div>
        </div>
      </div>

      {/* Platform Chart & Approval Action Queue */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Financial Flow Chart (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Platform Financial Flow (6 Months)</h2>
              <p className="text-xs text-slate-400">Deposits vs Withdrawals vs Commission Liabilities (PKR)</p>
            </div>
            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px]">
              Actual Aggregated Ledger
            </Badge>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <RechartsTooltip
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString('en-PK')}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="deposits" name="Deposits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commissions" name="Commissions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Action Queue (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Pending Approval Queue</h3>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                {pendingActions.length} Pending
              </Badge>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {pendingActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No items awaiting administrative approval. All clear!
                </div>
              ) : (
                pendingActions.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{item.type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{item.id.slice(-6)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.user}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-mono font-bold text-emerald-400">{item.amount}</span>
                        <span>•</span>
                        <span>{item.method}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                    <Link to={item.link}>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                      >
                        Review
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs">
            <Link
              to="/admin/withdrawals"
              className="text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Withdrawals ({kpis?.pendingWithdrawalsCount ?? 0})
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/admin/refunds"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Refunds ({kpis?.pendingRefundsCount ?? 0})
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/admin/task-submissions"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Tasks ({kpis?.pendingTaskSubmissionsCount ?? 0})
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Real-Time Platform Audit Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recent Platform Activity &amp; Audit Trail</h2>
            <p className="text-xs text-slate-400">
              Immutable ledger operations, access controls, and security triggers
            </p>
          </div>
          <Link to="/admin/audit-logs">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Full Audit Logs
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-800/60">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs text-slate-400">Log ID</TableHead>
                <TableHead className="text-xs text-slate-400">Action Type</TableHead>
                <TableHead className="text-xs text-slate-400">Actor</TableHead>
                <TableHead className="text-xs text-slate-400">Details</TableHead>
                <TableHead className="text-xs text-slate-400 text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAuditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-500">
                    No recent audit logs available.
                  </TableCell>
                </TableRow>
              ) : (
                recentAuditLogs.map((log) => (
                  <TableRow key={log._id} className="border-slate-800 hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-semibold text-slate-300">
                      #{log._id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-medium">
                      {log.actor?.name || 'System / Automated'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-md truncate">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 text-right font-mono">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}