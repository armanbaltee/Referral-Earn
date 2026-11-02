import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { walletApi, type WalletSummary, type WalletTransactionItem } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function WalletPage(): React.ReactElement {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, txData] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getMyTransactions({ limit: 5 }),
      ]);
      setSummary(walletData);
      setRecentTransactions(txData.transactions);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your balances, fund deposits, and withdrawal payouts.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/deposits">Deposit Funds</Link>
          </Button>
          <Button asChild>
            <Link to="/withdrawals">Request Payout</Link>
          </Button>
        </div>
      </div>

      {/* Main Balances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">{formatPKR(summary?.availableBalance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Cleared & available for instant withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500">{formatPKR(summary?.pendingBalance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Reserved funds awaiting admin review/payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{formatPKR(summary?.totalEarned || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative commissions & task rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Task Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPKR(summary?.breakdown?.taskEarnings || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Referral Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPKR(summary?.breakdown?.referralCommissions || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Milestone Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPKR(summary?.breakdown?.referralBonuses || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Refund Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPKR(summary?.breakdown?.refundCredits || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Ledger Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">View Full Ledger &rarr;</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Balance After</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{tx.type}</Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{tx.description}</td>
                      <td className={`py-3 px-4 font-bold ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.direction === 'credit' ? '+' : '-'}{formatPKR(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatPKR(tx.balanceAfter)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
