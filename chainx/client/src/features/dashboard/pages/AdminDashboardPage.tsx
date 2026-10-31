import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  ShoppingBag,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Info,
  ExternalLink,
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

// Sample Design Data for Admin Console
const adminPlatformChart = [
  { month: 'May', deposits: 12400, withdrawals: 7200, commissions: 3100 },
  { month: 'Jun', deposits: 18200, withdrawals: 9500, commissions: 4600 },
  { month: 'Jul', deposits: 24500, withdrawals: 14200, commissions: 6200 },
  { month: 'Aug', deposits: 31000, withdrawals: 18900, commissions: 7800 },
  { month: 'Sep', deposits: 42800, withdrawals: 24500, commissions: 10500 },
  { month: 'Oct', deposits: 56200, withdrawals: 31800, commissions: 14200 },
];

const pendingActionItems = [
  {
    id: 'W-9021',
    type: 'Withdrawal Request',
    user: 'Kashif M. (kashif@gmail.com)',
    amount: '$450.00',
    method: 'USDT (TRC20)',
    time: '14 mins ago',
    risk: 'Low',
  },
  {
    id: 'D-8812',
    type: 'Deposit Proof Review',
    user: 'Sara K. (sara.k@outlook.com)',
    amount: '$100.00',
    method: 'Manual Gateway (JazzCash)',
    time: '28 mins ago',
    risk: 'Low',
  },
  {
    id: 'RF-104',
    type: '100% Refund Request',
    user: 'Bilal T. (bilal.t@yahoo.com)',
    amount: '$100.00',
    method: '10/10 Referrals Verified',
    time: '1 hour ago',
    risk: 'Verified',
  },
  {
    id: 'TSK-991',
    type: 'Task Submission Batch',
    user: '12 Users Submitted Proofs',
    amount: '$30.00 Total',
    method: 'Telegram Join Task',
    time: '2 hours ago',
    risk: 'Low',
  },
];

const recentAuditLogs = [
  {
    id: 'AUD-501',
    action: 'COMMISSION_PAYOUT_TRIGGERED',
    actor: 'System Engine',
    details: 'Tier 1 commission ($15.00) credited to User #8821',
    time: '3 mins ago',
    level: 'info',
  },
  {
    id: 'AUD-500',
    action: 'WITHDRAWAL_APPROVED',
    actor: 'Admin (Arman Ali)',
    details: 'Approved $250.00 USDT transfer to User #4019',
    time: '42 mins ago',
    level: 'security',
  },
  {
    id: 'AUD-499',
    action: 'NEW_USER_REGISTERED',
    actor: 'Public Gateway',
    details: 'User #9210 registered with referral code CHX-78291',
    time: '1 hour ago',
    level: 'info',
  },
  {
    id: 'AUD-498',
    action: 'SUSPICIOUS_LOGIN_ATTEMPT',
    actor: 'Security Firewall',
    details: 'Rate limit tripped: 5 failed logins on admin panel IP 192.168.1.1',
    time: '3 hours ago',
    level: 'warning',
  },
];

export default function AdminDashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Design Data Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs text-blue-300">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <strong>Admin Console Preview:</strong> Displaying system-level financial liabilities,
            pending approval queues, and transaction integrity checks.
          </span>
        </div>
        <Badge className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px]">
          Sample Design Data
        </Badge>
      </div>

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
            Real-time control center for affiliates, escrow wallets, withdrawals, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/withdrawals">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
              Process Withdrawals (5)
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Export Report
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Primary Platform KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Registered Users
            </span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">1,248</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" /> +18.4% this month
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verified Users
            </span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">892</div>
          <div className="text-[11px] text-slate-400 mt-1">71.4% activation rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Registrations
            </span>
            <UserPlus className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">356</div>
          <div className="text-[11px] text-amber-400 mt-1">Awaiting email / deposit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product Sales (Orders)
            </span>
            <ShoppingBag className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">$89,200</div>
          <div className="text-[11px] text-slate-400 mt-1">892 packages sold</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Commission Liabilities
            </span>
            <DollarSign className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">$14,250</div>
          <div className="text-[11px] text-slate-400 mt-1">Calculated across MLM tiers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Withdrawals
            </span>
            <ArrowUpCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">$2,180.00</div>
          <div className="text-[11px] text-slate-400 mt-1">5 requests in approval queue</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Deposits
            </span>
            <ArrowDownCircle className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">$300.00</div>
          <div className="text-[11px] text-slate-400 mt-1">3 manual receipts awaiting check</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Refund Requests
            </span>
            <RotateCcw className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">2 Pending</div>
          <div className="text-[11px] text-slate-400 mt-1">10-referral milestone met</div>
        </div>
      </div>

      {/* Platform Chart & Approval Action Queue */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Financial Flow Chart (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Platform Financial Flow (6 Months)</h2>
              <p className="text-xs text-slate-400">Deposits vs Withdrawals vs Commission Liabilities</p>
            </div>
            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px]">
              Net Inflow: +$24,400
            </Badge>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminPlatformChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="deposits" name="Deposits ($)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commissions" name="Commissions ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                Requires Action
              </Badge>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {pendingActionItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{item.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.user}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-mono font-bold text-emerald-400">{item.amount}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3 text-center">
            <Link
              to="/admin/withdrawals"
              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Open comprehensive audit approvals
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
              {recentAuditLogs.map((log) => (
                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-300">
                    {log.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        log.level === 'security'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]'
                          : log.level === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 text-[10px]'
                      }
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 font-medium">{log.actor}</TableCell>
                  <TableCell className="text-xs text-slate-400">{log.details}</TableCell>
                  <TableCell className="text-xs text-slate-500 text-right font-mono">
                    {log.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
