import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { FormField } from '@components/ui/label';
import { useAuthStore } from '@store/auth.store';
import { authApi } from '../auth.api';

type PaymentTab = 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'crypto';

export default function RegistrationPaymentPage(): React.ReactElement {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [activeTab, setActiveTab] = useState<PaymentTab>('jazzcash');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check state passed from registration or login
  const locationState = location.state as {
    message?: string;
    registrationFee?: number;
  } | null;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPendingReview =
    user?.registrationPaymentStatus === 'pending' || submitSuccess;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setErrorMessage('Please enter the Transaction ID / Reference number.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const methodMap: Record<PaymentTab, 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'manual'> = {
        jazzcash: 'jazzcash',
        easypaisa: 'easypaisa',
        bank_transfer: 'bank_transfer',
        crypto: 'manual',
      };

      await authApi.submitRegistrationPayment({
        paymentMethod: methodMap[activeTab],
        paymentReference: transactionRef.trim(),
        notes: senderInfo.trim() || undefined,
      });

      updateUser({ registrationPaymentStatus: 'pending' });
      setSubmitSuccess(true);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setErrorMessage(
          axError.response?.data?.message || 'Failed to submit payment details. Please try again.'
        );
      } else {
        setErrorMessage('Connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Overview Card */}
      <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500" />
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">Account Activation</CardTitle>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> Pending Fee
            </span>
          </div>
          <CardDescription className="text-sm">
            Complete your registration fee to activate your multi-tier affiliate account and referral link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fee Highlight Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/40 gap-4">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Mandatory Registration Fee
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  Rs. 15,000
                </span>
                <span className="text-xs text-muted-foreground font-medium">PKR (~$55 USDT)</span>
              </div>
            </div>
            <div className="text-xs text-right space-y-0.5 sm:border-l sm:border-border sm:pl-4">
              <span className="text-muted-foreground block">Account Reference:</span>
              <span className="font-mono font-semibold text-foreground">
                {user?.referralCode || 'CHX-REGISTER'}
              </span>
            </div>
          </div>

          {locationState?.message && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{locationState.message}</span>
            </div>
          )}

          {isPendingReview ? (
            /* Pending Review State */
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Payment Verification in Progress</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your payment reference has been submitted and is currently being verified by our finance department.
                Verification normally takes between 15 to 30 minutes during working hours.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full sm:w-auto text-xs"
                >
                  Refresh Status
                </Button>
                <Link to="/dashboard">
                  <Button className="w-full sm:w-auto text-xs gap-1.5">
                    Preview Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Payment Instructions & Form */
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  1. Select Payment Method
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('jazzcash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                      activeTab === 'jazzcash'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mb-1.5" />
                    JazzCash
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('easypaisa')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                      activeTab === 'easypaisa'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mb-1.5" />
                    EasyPaisa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bank_transfer')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                      activeTab === 'bank_transfer'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Building className="h-5 w-5 mb-1.5" />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('crypto')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                      activeTab === 'crypto'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mb-1.5" />
                    USDT (TRC-20)
                  </button>
                </div>
              </div>

              {/* Method Details Box */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 text-xs">
                {activeTab === 'jazzcash' && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Title:</span>
                      <span className="font-semibold text-foreground">ChainX Official</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">JazzCash Mobile / Till:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">03018844221</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03018844221', 'jc_num')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === 'jc_num' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      Send exact Rs. 15,000 from your JazzCash app. Enter the Transaction ID (TID) received via SMS below.
                    </p>
                  </div>
                )}

                {activeTab === 'easypaisa' && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Title:</span>
                      <span className="font-semibold text-foreground">ChainX Financials</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">EasyPaisa Account:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">03457711993</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03457711993', 'ep_num')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === 'ep_num' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      Transfer Rs. 15,000 via EasyPaisa app or agent. Enter the 11-digit TRX ID below.
                    </p>
                  </div>
                )}

                {activeTab === 'bank_transfer' && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-semibold text-foreground">Meezan Bank Ltd</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Title:</span>
                      <span className="font-semibold text-foreground">ChainX Technologies (Pvt) Ltd</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">01010105829102</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('01010105829102', 'acc_num')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === 'acc_num' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">IBAN:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-foreground">PK49MEZN0001010105829102</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('PK49MEZN0001010105829102', 'iban')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === 'iban' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'crypto' && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Token & Network:</span>
                      <span className="font-semibold text-foreground">USDT (TRON / TRC-20)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Exact Amount:</span>
                      <span className="font-mono font-bold text-foreground">55.00 USDT</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Deposit Wallet Address:</span>
                      <div className="flex items-center justify-between p-2 rounded bg-background border font-mono text-[11px] break-all">
                        <span>TXchainX99PlatformOfficialWalletTRC20</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('TXchainX99PlatformOfficialWalletTRC20', 'trc20')}
                          className="ml-2 text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          {copiedField === 'trc20' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Proof Submission Form */}
              <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  2. Submit Payment Reference
                </p>

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <FormField
                  label="Transaction ID / Reference Number"
                  required
                  hint="Enter the TID, TRX ID, or bank reference from your transaction receipt"
                >
                  <Input
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. 19283746502 or Bank Ref"
                    className="font-mono tracking-wider"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Sender Details / Notes (Optional)"
                  hint="Your sending mobile number or account holder name"
                >
                  <Input
                    value={senderInfo}
                    onChange={(e) => setSenderInfo(e.target.value)}
                    placeholder="e.g. Sent from 0300-XXXXXXX (Ali)"
                    disabled={isSubmitting}
                  />
                </FormField>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/25 mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting Verification...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Submit Payment for Verification <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-6 border-t border-border/40 bg-muted/20 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            24/7 Verification Hotline
          </span>
          <Link to="/support" className="text-primary hover:underline flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Need help paying? Contact Support
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
