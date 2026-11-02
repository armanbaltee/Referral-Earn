import React, { useEffect, useState } from 'react';
import { walletApi } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminWalletsPage(): React.ReactElement {
  const [wallets, setWallets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjustment modal
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustAmountPKR, setAdjustAmountPKR] = useState('100');
  const [adjustDirection, setAdjustDirection] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    loadWallets();
  }, [page, search]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await walletApi.getWalletsAdmin({ page, limit: 15, search: search || undefined });
      setWallets(res.wallets);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load admin wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustError(null);

    const amountNum = parseFloat(adjustAmountPKR);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAdjustError('Please enter a valid positive adjustment amount.');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 5) {
      setAdjustError('A detailed reason (min 5 characters) is mandatory for audit logging.');
      return;
    }

    try {
      setAdjusting(true);
      await walletApi.adminAdjustment(adjustTarget.user._id, {
        amount: Math.round(amountNum * 100),
        direction: adjustDirection,
        reason: adjustReason.trim(),
        reference: adjustReference.trim() || undefined,
      });
      setAdjustTarget(null);
      setAdjustReason('');
      setAdjustReference('');
      loadWallets();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to apply adjustment.');
    } finally {
      setAdjusting(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Wallets & Balances</h1>
          <p className="text-sm text-muted-foreground">Monitor system-wide user balances and execute authorized ledger adjustments.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Wallets Overview</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search by name, email, or ref code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No wallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">Pending Debit</th>
                    <th className="py-3 px-4">Total Earned</th>
                    <th className="py-3 px-4">Total Withdrawn</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {wallets.map((w) => (
                    <tr key={w._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{w.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{w.user?.email}</div>
                        <div className="text-xs font-mono text-primary">{w.user?.referralCode}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(w.availableBalance || 0)}</td>
                      <td className="py-3 px-4 font-semibold text-amber-500">{formatPKR(w.pendingBalance || 0)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatPKR(w.totalEarned || 0)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatPKR(w.totalWithdrawn || 0)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={w.user?.accountStatus === 'active' ? 'success' : 'outline'}>
                          {w.user?.accountStatus || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustTarget(w);
                            setAdjustAmountPKR('100');
                            setAdjustReason('');
                            setAdjustError(null);
                          }}
                        >
                          Manual Adjustment
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Adjustment Dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Manual Ledger Adjustment</DialogTitle>
          </DialogHeader>
          {adjustTarget && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <div>User: <strong>{adjustTarget.user?.name}</strong> ({adjustTarget.user?.email})</div>
                <div>Current Available: <strong>{formatPKR(adjustTarget.availableBalance || 0)}</strong></div>
              </div>

              {adjustError && <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-700 border border-rose-200">{adjustError}</div>}

              <div>
                <Label>Direction</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('credit')}
                    className={`p-2.5 rounded border text-sm font-semibold transition ${
                      adjustDirection === 'credit'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('debit')}
                    className={`p-2.5 rounded border text-sm font-semibold transition ${
                      adjustDirection === 'debit'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    Debit (-)
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="adj-amount">Adjustment Amount (PKR)</Label>
                <Input
                  id="adj-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={adjustAmountPKR}
                  onChange={(e) => setAdjustAmountPKR(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="adj-reason">Audit Reason *</Label>
                <Input
                  id="adj-reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for payment gateway reconciliation #819"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adj-ref">Supporting Reference / Ticket #</Label>
                <Input
                  id="adj-ref"
                  value={adjustReference}
                  onChange={(e) => setAdjustReference(e.target.value)}
                  placeholder="e.g. TICKET-9921"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={adjusting}>
                  {adjusting ? 'Applying...' : `Execute ${adjustDirection.toUpperCase()}`}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
