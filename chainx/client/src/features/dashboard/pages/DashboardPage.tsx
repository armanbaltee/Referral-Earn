import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Users,
  CheckSquare,
  Gift,
  RotateCcw,
  Copy,
  Check,
  TrendingUp,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { StatCard } from '@components/ui/stat-card';
import { Progress } from '@components/ui/misc';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@components/ui/table';
import { useAuthStore } from '@store/auth.store';
import { walletApi, type WalletSummary, type WalletTransactionItem } from '@/features/wallet/wallet.api';
import { referralApi, type ReferralDashboardResponse } from '@/features/referrals/referral.api';
import { taskApi, type TaskItem } from '@/features/tasks/task.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPKR(paisa: number): string {
  return `Rs. ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeLeft(endDate?: string): string {
  if (!endDate) return 'No deadline';
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TASK_REWARD: 'Task Reward',
    REFERRAL_COMMISSION: 'Referral Commission',
    REFERRAL_BONUS: 'Milestone Bonus',
    REGISTRATION_REFUND: 'Registration Refund',
    ADJUSTMENT: 'Admin Adjustment',
    REVERSAL: 'Reversal',
  };
  return map[type] ?? type;
}

// Build 7-day chart from last 30 real transactions
function buildChartData(transactions: WalletTransactionItem[]) {
  const days: Record<string, { day: string; referralEarnings: number; taskEarnings: number; total: number }> = {};
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Initialise last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = labels[d.getDay()];
    days[key] = { day: label, referralEarnings: 0, taskEarnings: 0, total: 0 };
  }

  transactions.forEach((tx) => {
    const key = tx.createdAt.slice(0, 10);
    if (!days[key]) return;
    if (tx.direction !== 'credit') return;
    const pkr = tx.amount / 100;
    if (tx.type === 'REFERRAL_COMMISSION' || tx.type === 'REFERRAL_BONUS') {
      days[key].referralEarnings += pkr;
    } else if (tx.type === 'TASK_REWARD') {
      days[key].taskEarnings += pkr;
    }
    days[key].total += pkr;
  });

  return Object.values(days);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-muted h-24" />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);

  // Data state
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [referralData, setReferralData] = useState<ReferralDashboardResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy link
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = user?.referralCode ?? '';
  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  const handleCopyLink = (): void => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes, referralRes, taskRes] = await Promise.allSettled([
        walletApi.getMyWallet(),
        walletApi.getMyTransactions({ limit: 30, page: 1 }),
        referralApi.getDashboard(),
        taskApi.getAvailableTasks({ limit: 5, page: 1 }),
      ]);

      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions ?? []);
      if (referralRes.status === 'fulfilled') setReferralData(referralRes.value);
      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value.tasks ?? []);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const chartData = buildChartData(transactions);
  const recentTxs = transactions.slice(0, 5);

  const milestone = referralData?.milestone;
  const refund = referralData?.feeRefund;
  const stats = referralData?.statistics;

  const thisWeekEarnings = chartData.reduce((sum, d) => sum + d.total, 0);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => void fetchAll()}>
            Retry
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome, {user?.name ?? '—'}!
            </h1>
            <Badge variant="success" className="text-[10px]">
              Active Partner
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track your wallet, referral progress, task milestones, and 100% refund eligibility.
          </p>
        </div>

        {/* Referral Link Widget */}
        {referralLink && (
          <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-xl border border-border max-w-md w-full md:w-auto">
            <div className="text-xs truncate font-mono px-2 select-all text-muted-foreground">
              {referralLink}
            </div>
            <Button
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs shrink-0 font-medium"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Primary Financial Overview Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Balance"
            value={formatPKR(wallet?.availableBalance ?? 0)}
            subtitle="Ready for withdrawal"
            icon={<Wallet className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-500/10 text-blue-600"
          />
          <StatCard
            title="Total Earned"
            value={formatPKR(wallet?.totalEarned ?? 0)}
            subtitle="Lifetime earnings"
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-500/10 text-emerald-600"
          />
          <StatCard
            title="Pending Balance"
            value={formatPKR(wallet?.pendingBalance ?? 0)}
            subtitle="Awaiting clearance"
            trend="neutral"
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-500/10 text-amber-600"
          />
          <StatCard
            title="Direct Referrals"
            value={String(stats?.totalReferred ?? 0)}
            subtitle={`${stats?.eligibleCount ?? 0} eligible · ${stats?.pendingCount ?? 0} pending`}
            icon={<Users className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-500/10 text-purple-600"
          />
        </div>
      )}

      {/* Secondary Financial Breakdown */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4 border-border/80">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Referral Commissions</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono mt-2 text-foreground">
              {formatPKR(wallet?.breakdown?.referralCommissions ?? 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {stats?.totalReferred ?? 0} direct referrals
            </div>
          </Card>

          <Card className="p-4 border-border/80">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Task Earnings</span>
              <CheckSquare className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono mt-2 text-foreground">
              {formatPKR(wallet?.breakdown?.taskEarnings ?? 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">From approved task submissions</div>
          </Card>

          <Card className="p-4 border-border/80">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Milestone Bonuses</span>
              <Gift className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono mt-2 text-foreground">
              {formatPKR(wallet?.breakdown?.referralBonuses ?? 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {milestone?.isAchieved ? '10-referral bonus credited' : 'Milestone bonus pending'}
            </div>
          </Card>
        </div>
      )}

      {/* Refund Progress Banner */}
      {!loading && refund && (
        <Card className="p-5 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-foreground">
                  Registration Fee Refund Progress
                </h2>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">
                  {refund.qualifyingCount} / {refund.threshold} Referrals
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Refer {refund.threshold} verified members to claim a full refund of your{' '}
                {formatPKR(refund.feeAmountPaisa)} registration fee.
                {refund.isEligible && (
                  <span className="ml-1 font-semibold text-emerald-600">
                    ✓ You are eligible! Visit Wallet to claim.
                  </span>
                )}
              </p>
            </div>

            <div className="w-full md:w-64 space-y-1.5 shrink-0">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {Math.round((refund.qualifyingCount / refund.threshold) * 100)}%
                  {!refund.isEligible && ` (${refund.threshold - refund.qualifyingCount} remaining)`}
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.round((refund.qualifyingCount / refund.threshold) * 100))}
                className="h-2.5 bg-muted"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Chart + Available Tasks Grid */}
      <div className="grid gap-6 lg:grid-cols-7">

        {/* Earnings Chart (4 cols) */}
        <Card className="lg:col-span-4 p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Earnings — Last 7 Days</CardTitle>
              <CardDescription className="text-xs">
                Daily breakdown: Referral Commissions vs Task Rewards
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              This Week: {formatPKR(thisWeekEarnings * 100)}
            </Badge>
          </CardHeader>
          <CardContent className="p-0 h-64 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTask" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`Rs. ${value.toFixed(0)}`, undefined]}
                  />
                  <Area
                    type="monotone"
                    dataKey="referralEarnings"
                    name="Referrals (Rs.)"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRef)"
                  />
                  <Area
                    type="monotone"
                    dataKey="taskEarnings"
                    name="Tasks (Rs.)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTask)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Available Tasks (3 cols) */}
        <Card className="lg:col-span-3 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Available Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs text-primary hover:underline font-medium">
                View all
              </Link>
            </div>

            <div className="divide-y divide-border/60 mt-2 min-h-[120px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-xs text-muted-foreground">
                  <CheckSquare className="h-6 w-6 mb-2 opacity-30" />
                  <span>No tasks available right now</span>
                </div>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-foreground line-clamp-1">{task.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-emerald-600 font-mono">
                          {formatPKR(task.rewardAmount)}
                        </span>
                        <span>•</span>
                        <span>{formatTimeLeft(task.endDate)}</span>
                      </div>
                    </div>
                    <Link to={`/tasks/${task._id}`}>
                      <Button size="sm" variant="default" className="h-7 text-xs px-2.5 shrink-0">
                        Start
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-3 text-center">
            <Link
              to="/tasks"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
            >
              All daily earning opportunities
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">
              Latest ledger activity on your ChainX wallet
            </p>
          </div>
          <Link to="/transactions">
            <Button variant="outline" size="sm" className="text-xs">
              All Transactions
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Type & Description</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : recentTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No transactions yet. Make a deposit or complete a task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                recentTxs.map((tx) => (
                  <TableRow key={tx._id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[10px] font-semibold text-foreground">
                      {tx._id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{txTypeLabel(tx.type)}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {tx.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === 'COMPLETED' || tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'PENDING' || tx.status === 'pending'
                              ? 'warning'
                              : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {tx.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-xs font-mono font-bold text-right ${
                        tx.direction === 'credit'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : '-'}{formatPKR(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
