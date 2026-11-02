import React, { useEffect, useState } from 'react';
import { walletApi, type DepositItem, type PaymentInstructions } from '../wallet.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function DepositsPage(): React.ReactElement {
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [amountPKR, setAmountPKR] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const [senderNotes, setSenderNotes] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inst, history] = await Promise.all([
        walletApi.getPaymentInstructions(),
        walletApi.getMyDeposits({ limit: 10 }),
      ]);
      setInstructions(inst);
      setDeposits(history.deposits);
    } catch (err: any) {
      console.error('Failed to load deposit data:', err);
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
      setError('Minimum deposit is Rs. 100.');
      return;
    }
    if (!paymentReference.trim()) {
      setError('Please provide the transaction ID / TRX reference.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await walletApi.submitDeposit({
        amount: Math.round(amountNum * 100),
        paymentMethod,
        paymentReference: paymentReference.trim(),
        proofImageUrl: proofImageUrl.trim() || undefined,
        senderNotes: senderNotes.trim() || undefined,
      });
      setSuccess(res.message);
      setPaymentReference('');
      setProofImageUrl('');
      setSenderNotes('');
      // Refresh history
      const history = await walletApi.getMyDeposits({ limit: 10 });
      setDeposits(history.deposits);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit deposit request.');
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

  const activeAccount = instructions?.[paymentMethod];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deposit Funds</h1>
        <p className="text-sm text-muted-foreground">Add funds to your ChainX account via manual Easypaisa or JazzCash transfer.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deposit Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Deposit Request</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="mb-4 rounded bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select Payment Method</Label>
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
                <Label htmlFor="amount">Deposit Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="1"
                  value={amountPKR}
                  onChange={(e) => setAmountPKR(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Min: Rs. 100 — Max: Rs. 100,000</p>
              </div>

              <div>
                <Label htmlFor="ref">Transaction Reference / TRX ID</Label>
                <Input
                  id="ref"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 01847192847"
                  required
                />
              </div>

              <div>
                <Label htmlFor="proof">Receipt Image URL (Cloudinary / Hosted)</Label>
                <Input
                  id="proof"
                  type="url"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../receipt.png"
                />
              </div>

              <div>
                <Label htmlFor="notes">Sender Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={senderNotes}
                  onChange={(e) => setSenderNotes(e.target.value)}
                  placeholder="e.g. Sent from 03001234567"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Deposit for Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transfer Instructions */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-md flex items-center justify-between">
                <span>Official Receiving Account</span>
                <Badge variant="outline" className="capitalize">{paymentMethod}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground uppercase">Account Title</div>
                <div className="text-base font-bold">{activeAccount?.accountTitle || 'ChainX Financial Services'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Account Number</div>
                <div className="text-xl font-mono font-bold text-primary">{activeAccount?.accountNumber || '03457711993'}</div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Instructions:</div>
                <p className="text-xs mt-1 text-foreground/80 leading-relaxed">{activeAccount?.instructions}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Deposit Security</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Always verify the account title before confirming transfer in your app.</li>
              <li>Keep the transaction receipt or SMS reference until your deposit is approved.</li>
              <li>Approval typically takes 5–30 minutes during standard business hours.</li>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deposit History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No deposit requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">TRX Reference</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deposits.map((d) => (
                    <tr key={d._id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 uppercase text-xs font-semibold">{d.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-xs">{d.paymentReference}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(d.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={d.status === 'completed' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {d.rejectionReason || d.adminNotes || d.senderNotes || '-'}
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
