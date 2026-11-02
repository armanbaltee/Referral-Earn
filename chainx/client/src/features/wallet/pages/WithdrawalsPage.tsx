import React, { useEffect, useState } from 'react';
import { walletApi, type WithdrawalItem, type WalletSummary } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function WithdrawalsPage(): React.ReactElement {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [amountPKR, setAmountPKR] = useState<string>('1500');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [accountTitle, setAccountTitle] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletData, history] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getMyWithdrawals({ limit: 10 }),
      ]);
      setSummary(walletData);
      setWithdrawals(history.withdrawals);
    } catch (err) {
      console.error('Failed to load withdrawal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amountNum = parseFloat(amountPKR);
    if (isNaN(amountNum) || amountNum < 100) {
      setError('Minimum withdrawal is Rs. 100.');
      return;
    }

    if (summary && Math.round(amountNum * 100) > summary.availableBalance) {
      setError(`Requested amount exceeds available balance of Rs. ${(summary.availableBalance / 100).toLocaleString()}.`);
      return;
    }

    if (!/^03\d{9}$/.test(accountNumber.trim())) {
      setError('Enter a valid 11-digit Pakistani mobile number (03XXXXXXXXX).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await walletApi.submitWithdrawal({
        amount: Math.round(amountNum * 100),
        paymentMethod,
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
      });
      setSuccess(res.message);
      // Reload wallet and history
      const [w, h] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getMyWithdrawals({ limit: 10 }),
      ]);
      setSummary(w);
      setWithdrawals(h.withdrawals);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Withdrawal Requests</h1>
        <p className="text-sm text-muted-foreground">Request payouts to your verified Easypaisa or JazzCash mobile wallet.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit Payout Request</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="mb-4 rounded bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Payout Method</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('easypaisa')}
                    className={`p-3 rounded-lg border text-center font-medium transition ${
                      paymentMethod === 'easypaisa'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-600'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    Easypaisa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-3 rounded-lg border text-center font-medium transition ${
                      paymentMethod === 'jazzcash'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold ring-2 ring-amber-600'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    JazzCash
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="w-amount">Withdrawal Amount (PKR)</Label>
                <Input
                  id="w-amount"
                  type="number"
                  min="100"
                  step="1"
                  value={amountPKR}
                  onChange={(e) => setAmountPKR(e.target.value)}
                  placeholder="e.g. 1500"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: <span className="font-semibold text-primary">{formatPKR(summary?.availableBalance || 0)}</span> (Min: Rs. 100)
                </p>
              </div>

              <div>
                <Label htmlFor="acc-title">Account Holder Full Name</Label>
                <Input
                  id="acc-title"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="As registered in your mobile wallet app"
                  required
                />
              </div>

              <div>
                <Label htmlFor="acc-num">Mobile Wallet Number</Label>
                <Input
                  id="acc-num"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Reserving & Submitting...' : 'Confirm & Request Payout'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal Lifecycle & Rules */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Withdrawal Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span><strong className="text-foreground">PENDING / UNDER REVIEW:</strong> Funds reserved from available balance.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span><strong className="text-foreground">APPROVED:</strong> Admin verified account details; queued for batch dispatch.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span><strong className="text-foreground">COMPLETED:</strong> Payout sent to your mobile wallet. Ledger debit finalized.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span><strong className="text-foreground">REJECTED / FAILED:</strong> Reserved amount is immediately released back to your available balance.</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Payout Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Only one pending withdrawal is allowed at a time.</li>
              <li>Ensure your mobile wallet account limit is not exceeded to avoid dispatch errors.</li>
              <li>Payouts are processed 7 days a week between 10:00 AM and 10:00 PM PKT.</li>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No withdrawal requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Account Details</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reference / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 uppercase text-xs font-semibold">{w.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs">{w.accountTitle}</div>
                        <div className="font-mono text-xs text-muted-foreground">{w.accountNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">{formatPKR(w.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={w.status === 'completed' ? 'success' : w.status === 'rejected' || w.status === 'failed' ? 'danger' : 'warning'}>
                          {w.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {w.gatewayTransactionId ? `TID: ${w.gatewayTransactionId}` : w.rejectionReason || w.adminNotes || '-'}
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
