import React, { useEffect, useState } from 'react';
import { walletApi, type WalletTransactionItem } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminLedgerPage(): React.ReactElement {
  const [summary, setSummary] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, txs] = await Promise.all([
        walletApi.getFinancialSummary(),
        walletApi.getAdminLedger({ page, limit: 20, type: typeFilter || undefined }),
      ]);
      setSummary(sum);
      setTransactions(txs.transactions);
      setTotalPages(txs.meta.totalPages);
    } catch (err) {
      console.error('Failed to load global ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Financial Ledger & Accounting</h1>
        <p className="text-sm text-muted-foreground">Immutable platform-wide audit journal, aggregate revenue metrics, and liability breakdown.</p>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800">Total Approved Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">{formatPKR(summary?.totalDeposits || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-rose-800">Total Paid Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-700">{formatPKR(summary?.totalWithdrawals || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800">Pending Liabilities (Reserved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-700">{formatPKR(summary?.pendingWithdrawals || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-800">Total Task Rewards Credited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-700">{formatPKR(summary?.totalTaskRewards || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Global Ledger Journal Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Global Financial Journal</CardTitle>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All Transaction Types</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="TASK_REWARD">TASK_REWARD</option>
            <option value="REFERRAL_COMMISSION">REFERRAL_COMMISSION</option>
            <option value="REFERRAL_BONUS">REFERRAL_BONUS</option>
            <option value="REGISTRATION_REFUND">REGISTRATION_REFUND</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="REVERSAL">REVERSAL</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No ledger entries match this criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Balance After</th>
                    <th className="py-3 px-4">Auditor / Agent</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-xs">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-xs">{t.user?.name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{t.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-sans font-medium text-xs">{t.type}</Badge>
                      </td>
                      <td className="py-3 px-4 font-sans text-xs max-w-xs truncate">{t.description}</td>
                      <td className={`py-3 px-4 font-bold ${t.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.direction === 'credit' ? '+' : '-'}{formatPKR(t.amount)}
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatPKR(t.balanceAfter)}</td>
                      <td className="py-3 px-4 font-sans text-xs text-muted-foreground">
                        {t.processedBy?.name || 'Automated / System'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : 'danger'}>
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4 font-sans">
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
    </div>
  );
}
