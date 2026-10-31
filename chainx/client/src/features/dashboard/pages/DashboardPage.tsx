import React, { useState } from 'react';
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
  Info,
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

// Sample Design Data for Visual Fidelity
const earningsChartData = [
  { day: 'Mon', referralEarnings: 45, taskEarnings: 15, total: 60 },
  { day: 'Tue', referralEarnings: 80, taskEarnings: 20, total: 100 },
  { day: 'Wed', referralEarnings: 65, taskEarnings: 25, total: 90 },
  { day: 'Thu', referralEarnings: 110, taskEarnings: 30, total: 140 },
  { day: 'Fri', referralEarnings: 95, taskEarnings: 20, total: 115 },
  { day: 'Sat', referralEarnings: 140, taskEarnings: 35, total: 175 },
  { day: 'Sun', referralEarnings: 180, taskEarnings: 40, total: 220 },
];

const sampleTransactions = [
  {
    id: 'TX-98231',
    type: 'Referral Commission',
    direction: 'credit',
    amount: '+$45.00',
    status: 'completed',
    date: 'Oct 31, 2026 14:20',
    meta: 'Direct Level 1: Alex R.',
  },
  {
    id: 'TX-98219',
    type: 'Task Reward',
    direction: 'credit',
    amount: '+$5.00',
    status: 'completed',
    date: 'Oct 31, 2026 11:05',
    meta: 'Task #104: Telegram Group Join',
  },
  {
    id: 'TX-98104',
    type: 'USDT Withdrawal',
    direction: 'debit',
    amount: '-$120.00',
    status: 'processing',
    date: 'Oct 30, 2026 18:45',
    meta: 'TRC20: T9zP...8x2Q',
  },
  {
    id: 'TX-97992',
    type: 'Initial Deposit',
    direction: 'credit',
    amount: '+$100.00',
    status: 'completed',
    date: 'Oct 28, 2026 09:12',
    meta: 'Account Activation Package',
  },
];

const sampleActiveTasks = [
  {
    id: 'TSK-1',
    title: 'Subscribe to ChainX YouTube Channel',
    reward: '$2.50',
    timeLeft: '4 hours',
    status: 'Ready',
    category: 'Social',
  },
  {
    id: 'TSK-2',
    title: 'Share Referral Post on Twitter / X',
    reward: '$3.00',
    timeLeft: '12 hours',
    status: 'In Review',
    category: 'Promotion',
  },
  {
    id: 'TSK-3',
    title: 'Complete 30-sec Survey Feedback',
    reward: '$1.50',
    timeLeft: '1 day',
    status: 'Ready',
    category: 'Feedback',
  },
];

export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = 'CHX-78291';
  const referralLink = `https://chainx.io/register?ref=${referralCode}`;

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Design Data Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <strong>Sample Design Preview:</strong> Visualizing Phase 2 layout with representative
            design tokens. Connected to ChainX production architecture.
          </span>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] bg-background">
          Enterprise UI
        </Badge>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome, {user?.name ?? 'Arman'}!
            </h1>
            <Badge variant="success" className="text-[10px]">
              Active Partner
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track your wallet, referral tree progress, task milestones, and 100% refund eligibility.
          </p>
        </div>

        {/* Quick Referral Link Widget */}
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
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Balance"
          value="$1,248.50"
          subtitle="Ready for withdrawal"
          change={14.8}
          changePeriod="vs last week"
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-500/10 text-blue-600"
        />

        <StatCard
          title="Total Earnings"
          value="$3,820.00"
          subtitle="Lifetime earned"
          change={28.4}
          changePeriod="vs last month"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-500/10 text-emerald-600"
        />

        <StatCard
          title="Pending Balance"
          value="$185.00"
          subtitle="Tasks & clearances"
          trend="neutral"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-500/10 text-amber-600"
        />

        <StatCard
          title="Successful Referrals"
          value="24"
          subtitle="7 active this week"
          change={12.0}
          changePeriod="3 tiers active"
          icon={<Users className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Secondary Financial Breakdown (Tasks, Commissions, Bonuses) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-border/80">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Referral Commissions</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono mt-2 text-foreground">$2,450.00</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Across Level 1, 2 &amp; 3 downline
          </div>
        </Card>

        <Card className="p-4 border-border/80">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Task Earnings</span>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono mt-2 text-foreground">$870.00</div>
          <div className="text-[11px] text-muted-foreground mt-1">112 tasks successfully approved</div>
        </Card>

        <Card className="p-4 border-border/80">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Referral Bonuses &amp; Pool</span>
            <Gift className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono mt-2 text-foreground">$500.00</div>
          <div className="text-[11px] text-muted-foreground mt-1">Monthly leaderboard reward</div>
        </Card>
      </div>

      {/* 100% Refund Eligibility Progress Banner */}
      <Card className="p-5 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground">
                100% Deposit Refund Guarantee Progress
              </h2>
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">
                7 / 10 Referrals
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Refer 10 verified members to receive a full 100% refund of your initial deposit ($100.00)
              directly to your available wallet balance.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-emerald-600 dark:text-emerald-400">70% (3 remaining)</span>
            </div>
            <Progress value={70} className="h-2.5 bg-muted" />
          </div>
        </div>
      </Card>

      {/* Charts and Active Tasks Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Earnings Chart (4 cols) */}
        <Card className="lg:col-span-4 p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Earnings Performance</CardTitle>
              <CardDescription className="text-xs">
                Daily breakdown of Referral Commissions vs Task Rewards
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              This Week: $900
            </Badge>
          </CardHeader>
          <CardContent className="p-0 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                />
                <Area
                  type="monotone"
                  dataKey="referralEarnings"
                  name="Referrals ($)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRef)"
                />
                <Area
                  type="monotone"
                  dataKey="taskEarnings"
                  name="Tasks ($)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTask)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Tasks (3 cols) */}
        <Card className="lg:col-span-3 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Available Daily Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs text-primary hover:underline font-medium">
                View all
              </Link>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {sampleActiveTasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-emerald-600 font-mono">{task.reward}</span>
                      <span>•</span>
                      <span>Expires in {task.timeLeft}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={task.status === 'Ready' ? 'default' : 'outline'}
                    className="h-7 text-xs px-2.5 shrink-0"
                  >
                    {task.status === 'Ready' ? 'Start' : 'Pending'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-3 text-center">
            <Link
              to="/tasks"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
            >
              Check all daily earning opportunities
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
              Real-time ledger activity on your ChainX wallet
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
                <TableHead className="text-xs">Transaction ID</TableHead>
                <TableHead className="text-xs">Type &amp; Description</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {tx.id}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{tx.type}</div>
                    <div className="text-[11px] text-muted-foreground">{tx.meta}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === 'completed'
                          ? 'success'
                          : tx.status === 'processing'
                            ? 'warning'
                            : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-xs font-mono font-bold text-right ${
                      tx.direction === 'credit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
