import React, { useEffect, useState } from 'react';
import { walletApi, type WalletTransactionItem } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TransactionsPage(): React.ReactElement {
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, directionFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await walletApi.getMyTransactions({
        page,
        limit: 15,
        type: typeFilter || undefined,
        direction: directionFilter || undefined,
      });
      setTransactions(res.transactions);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load transaction ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Ledger & Statement</h1>
        <p className="text-sm text-muted-foreground">Immutable audit record of all financial credits, debits, adjustments, and refunds.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
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

        <select
          value={directionFilter}
          onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Directions</option>
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (-)</option>
        </select>

        {(typeFilter || directionFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(''); setDirectionFilter(''); setPage(1); }}>
            Reset Filters
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ledger Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No matching transactions found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Prev Balance</th>
                      <th className="py-3 px-4">New Balance</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-xs">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/50">
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-sans font-medium text-xs">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-sans text-xs max-w-xs truncate">{tx.description}</td>
                        <td className={`py-3 px-4 font-bold ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.direction === 'credit' ? '+' : '-'}{formatPKR(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatPKR(tx.balanceBefore)}</td>
                        <td className="py-3 px-4 font-semibold">{formatPKR(tx.balanceAfter)}</td>
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

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
