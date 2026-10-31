import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  Check,
  X,
  Copy,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import {
  registrationPaymentApi,
  type RegistrationPaymentRecord,
} from '../registrationPayment.api';

export default function AdminRegistrationPaymentsPage(): React.ReactElement {
  const [payments, setPayments] = useState<RegistrationPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Review Modal State
  const [selectedPayment, setSelectedPayment] = useState<RegistrationPaymentRecord | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await registrationPaymentApi.adminGetPayments({
        search: search.trim() || undefined,
        verificationStatus: statusFilter === 'all' ? undefined : statusFilter,
      });
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const openReviewModal = (p: RegistrationPaymentRecord) => {
    setSelectedPayment(p);
    setInternalNotes(p.adminNotes || '');
    setRejectionReason('');
    setActionType(null);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setIsProcessing(true);
    try {
      await registrationPaymentApi.adminApprove(selectedPayment._id, internalNotes.trim() || undefined);
      setSelectedPayment(null);
      loadPayments();
    } catch {
      alert('Failed to approve registration payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this payment.');
      return;
    }
    setIsProcessing(true);
    try {
      await registrationPaymentApi.adminReject(
        selectedPayment._id,
        rejectionReason.trim(),
        internalNotes.trim() || undefined
      );
      setSelectedPayment(null);
      loadPayments();
    } catch {
      alert('Failed to reject registration payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Registration Fee Verifications
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review manual and automated partner fee submissions (Rs. 15,000), check transaction references, and activate user accounts.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction reference / TID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground">Verification:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Records</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Method / Mode</th>
                <th className="px-5 py-3.5">Reference Number</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    No registration payment requests found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const amountPKR = p.amount / 100;
                  return (
                    <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-foreground block">{p.user?.name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {p.user?.email} &bull; {p.user?.referralCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold uppercase text-foreground block">
                          {p.paymentMethod}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {p.paymentMode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-primary">
                        {p.paymentReference}
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">
                        Rs. {amountPKR.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(p.paymentTimestamp || p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {p.verificationStatus === 'approved' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Approved
                          </Badge>
                        ) : p.verificationStatus === 'rejected' ? (
                          <Badge variant="danger">Rejected</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending Review
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => openReviewModal(p)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review & Approval Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground">Review Registration Payment</h3>
                <span className="text-xs text-muted-foreground">
                  Reference: <strong className="font-mono text-foreground">{selectedPayment.paymentReference}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details Box */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Name:</span>
                <span className="font-bold text-foreground">{selectedPayment.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Email:</span>
                <span className="text-foreground">{selectedPayment.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-mono text-foreground">{selectedPayment.user?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Referral Code:</span>
                <span className="font-mono font-bold text-primary">{selectedPayment.user?.referralCode}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-semibold uppercase text-foreground">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID / TID:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                  <span>{selectedPayment.paymentReference}</span>
                  <button
                    type="button"
                    onClick={() => copyRef(selectedPayment.paymentReference)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/50">
                <span>Fee Amount:</span>
                <span className="text-primary">Rs. {(selectedPayment.amount / 100).toLocaleString()} PKR</span>
              </div>
              {selectedPayment.senderNotes && (
                <div className="pt-1 border-t border-border/50">
                  <span className="text-muted-foreground block text-[11px]">User Submission Note:</span>
                  <p className="text-foreground italic">{selectedPayment.senderNotes}</p>
                </div>
              )}
            </div>

            {/* Receipt Preview if uploaded */}
            {selectedPayment.proofImage && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Payment Receipt Attachment
                </span>
                <div className="rounded-xl overflow-hidden border border-border max-h-48 bg-black/20 flex items-center justify-center">
                  <img
                    src={selectedPayment.proofImage}
                    alt="Receipt"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <FormField label="Internal Verification Notes (Optional)" hint="Notes are logged for accounting audit trails">
              <Input
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Confirmed on Meezan bank statement / JazzCash Merchant portal"
                disabled={isProcessing}
              />
            </FormField>

            {/* Rejection Form if reject clicked */}
            {actionType === 'reject' && (
              <FormField label="Reason for Rejection" required hint="This message will be visible to the user">
                <Input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid TID. Amount not received in merchant account."
                  disabled={isProcessing}
                  className="border-destructive focus:ring-destructive"
                />
              </FormField>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSelectedPayment(null)}
                disabled={isProcessing}
              >
                Close
              </Button>

              {selectedPayment.verificationStatus === 'pending' && (
                <>
                  {actionType === 'reject' ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={handleReject}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => setActionType('reject')}
                      disabled={isProcessing}
                    >
                      Reject Payment
                    </Button>
                  )}

                  {actionType !== 'reject' && (
                    <Button
                      type="button"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                      onClick={handleApprove}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Activating User...' : 'Approve & Activate Account'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
