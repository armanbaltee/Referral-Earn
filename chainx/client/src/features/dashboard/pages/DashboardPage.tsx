import React from 'react';
import { Users, Wallet, CheckSquare, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { useAuthStore } from '@store/auth.store';

export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name ?? 'Partner'}!
            </h1>
            <Badge variant="success">Phase 1 Initialized</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Overview of your network performance, wallet balance, and active affiliate tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            View Analytics
          </Button>
          <Button size="sm">
            <ArrowUpRight className="h-4 w-4 mr-2" /> Share Referral Link
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Wallet Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Main ledger balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Direct Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Level 1 active affiliates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commissions Earned
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Across all 3 MLM tiers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Architecture & Phase 1 status card */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Architecture Status &amp; Readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
              <p className="font-semibold text-foreground">Frontend Stack</p>
              <p className="text-muted-foreground text-xs">
                React 18 + Vite + TypeScript (Strict) + Tailwind CSS + shadcn/ui + TanStack Query +
                Zustand
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
              <p className="font-semibold text-foreground">Backend Architecture</p>
              <p className="text-muted-foreground text-xs">
                Express.js + TypeScript + MongoDB + Mongoose + Zod validation + JWT auth +
                Pino/Morgan
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
              <p className="font-semibold text-foreground">Financial Ledger</p>
              <p className="text-muted-foreground text-xs">
                Double-entry minor unit paisa integers (1 PKR = 100 paisa) with strict ACID
                transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
