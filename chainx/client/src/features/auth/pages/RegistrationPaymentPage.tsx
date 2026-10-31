import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  Zap,
  ShieldCheck,
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
import { Badge } from '@components/ui/badge';
import { useAuthStore } from '@store/auth.store';
import {
  registrationPaymentApi,
  type RegistrationFeeConfig,
} from '../../registrationPayment/registrationPayment.api';

type PaymentMode = 'manual' | 'automated';
type PaymentMethodKey = 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'crypto';

export default function RegistrationPaymentPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Dynamic configuration from server
  const [config, setConfig] = useState<RegistrationFeeConfig | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('manual');
  const [activeMethod, setActiveMethod] = useState<PaymentMethodKey>('jazzcash');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual payment form
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automated sandbox state
  const [automatedGateway, setAutomatedGateway] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [isInitiatingAutomated, setIsInitiatingAutomated] = useState(false);
  const [automatedSession, setAutomatedSession] = useState<{
    orderId: string;
    txId: string;
    amount: string;
    gateway: string;
  } | null>(null);
  const [isVerifyingAutomated, setIsVerifyingAutomated] = useState(false);
  const [automatedSuccess, setAutomatedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await registrationPaymentApi.getConfig();
        setConfig(data);
      } catch {
        // Fallback default
        setConfig({
          amount: 1500000,
          currency: 'PKR',
          easypaisa: {
            accountTitle: 'ChainX Financial Services',
            accountNumber: '03457711993',
            instructions: 'Send Rs. 15,000 to the EasyPaisa account above. Enter the 11-digit TRX ID and upload receipt.',
          },
          jazzcash: {
            accountTitle: 'ChainX Technologies',
            accountNumber: '03018844221',
            instructions: 'Send Rs. 15,000 via JazzCash app or retailer till. Enter the TID from confirmation SMS.',
          },
          bankTransfer: {
            bankName: 'Meezan Bank Ltd',
            accountTitle: 'ChainX Technologies (Pvt) Ltd',
            accountNumber: '01010105829102',
            iban: 'PK49MEZN0001010105829102',
          },
          crypto: {
            network: 'TRON (TRC-20)',
            currency: 'USDT',
            amount: 55,
            walletAddress: 'TXchainX99PlatformOfficialWalletTRC20',
          },
          automatedSandboxEnabled: true,
          manualEnabled: true,
        });
      }
    }
    loadConfig();
  }, []);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPendingReview =
    user?.registrationPaymentStatus === 'pending' || submitSuccess;
  const isPaid = user?.registrationPaymentStatus === 'paid' || automatedSuccess;

  // ─── Mode A: Submit Manual Payment ──────────────────────────────────────────
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setErrorMessage('Please enter the Transaction ID / Reference number.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await registrationPaymentApi.submitManual({
        paymentMethod: activeMethod,
        paymentReference: transactionRef.trim(),
        proofImage: receiptUrl.trim() || undefined,
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

  // ─── Mode B: Initiate Automated Sandbox Payment ─────────────────────────────
  const handleInitiateAutomated = async () => {
    setErrorMessage(null);
    setIsInitiatingAutomated(true);
    try {
      const result = await registrationPaymentApi.initiateAutomated(automatedGateway);
      setAutomatedSession({
        orderId: result.initiation.merchantOrderId,
        txId: result.initiation.gatewayTransactionId,
        amount: result.formattedAmount,
        gateway: automatedGateway,
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setErrorMessage(
          axError.response?.data?.message || 'Failed to initiate automated checkout session.'
        );
      } else {
        setErrorMessage('Connection error. Please try again.');
      }
    } finally {
      setIsInitiatingAutomated(false);
    }
  };

  // Simulate Instant Gateway Callback & Idempotent Verification
  const handleSimulateAutomatedCallback = async (simulateSuccess: boolean) => {
    if (!automatedSession) return;
    setIsVerifyingAutomated(true);
    setErrorMessage(null);

    try {
      await registrationPaymentApi.triggerAutomatedCallback(
        automatedSession.gateway as 'easypaisa' | 'jazzcash',
        {
          merchantOrderId: automatedSession.orderId,
          orderRefNum: automatedSession.orderId,
          gatewayTransactionId: automatedSession.txId,
          transactionId: automatedSession.txId,
          pp_TxnRefNo: automatedSession.orderId,
          amount: 1500000,
          responseCode: simulateSuccess ? '0000' : '9999',
          status: simulateSuccess ? 'PAID' : 'FAILED',
          signature: 'SANDBOX_VERIFIED_SIGNATURE',
        }
      );

      if (simulateSuccess) {
        updateUser({ registrationPaymentStatus: 'paid', accountStatus: 'active', isActive: true });
        setAutomatedSuccess(true);
      } else {
        setErrorMessage('Automated sandbox transaction was declined or cancelled by the provider.');
        setAutomatedSession(null);
      }
    } catch {
      setErrorMessage('Failed to reconcile automated payment callback.');
    } finally {
      setIsVerifyingAutomated(false);
    }
  };

  const feeAmountFormatted = config ? `Rs. ${(config.amount / 100).toLocaleString()}` : 'Rs. 15,000';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500" />
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">Account Activation</CardTitle>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Account Activated
              </span>
            ) : isPendingReview ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" /> Verification Pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" /> Mandatory Activation Fee
              </span>
            )}
          </div>
          <CardDescription className="text-sm">
            Complete your registration fee to activate your multi-tier affiliate account and referral commissions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fee Highlight Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/40 gap-4">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Registration Fee (System Setting)
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  {feeAmountFormatted}
                </span>
                <span className="text-xs text-muted-foreground font-medium">PKR (~$55 USDT)</span>
              </div>
            </div>
            <div className="text-xs text-right space-y-0.5 sm:border-l sm:border-border sm:pl-4">
              <span className="text-muted-foreground block">Partner Code:</span>
              <span className="font-mono font-semibold text-foreground">
                {user?.referralCode || 'CHX-REGISTER'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isPaid ? (
            /* Paid & Activated Confirmation */
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Registration Confirmed!</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your registration payment has been verified. Your partner account, multi-tier referral code,
                and daily earning dashboard are now completely unlocked.
              </p>
              <div className="pt-2">
                <Link to="/dashboard">
                  <Button className="w-full sm:w-auto text-xs gap-1.5 shadow-md shadow-primary/25">
                    Launch Affiliate Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : isPendingReview ? (
            /* Pending Review State */
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Payment Verification Under Review</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your payment request has been securely recorded in our immutable ledger.
                An accounting administrator is reviewing the reference and receipt.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full sm:w-auto text-xs"
                >
                  Refresh Verification Status
                </Button>
                <Link to="/dashboard">
                  <Button className="w-full sm:w-auto text-xs gap-1.5">
                    Preview Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Choose Mode A or Mode B */
            <div className="space-y-5">
              {/* Mode Toggle */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Payment Mode
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentMode('manual'); setAutomatedSession(null); }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMode === 'manual'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> Mode A: Manual Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('automated')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMode === 'automated'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Zap className="h-4 w-4" /> Mode B: Automated Gateway
                  </button>
                </div>
              </div>

              {/* MODE B: AUTOMATED SANDBOX CHECKOUT */}
              {paymentMode === 'automated' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Authorized Provider Sandbox Adapter
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      This environment demonstrates official provider integration adapters (EasyPaisa & JazzCash)
                      with HMAC signed callback verification, timeout handling, and idempotency protection.
                    </p>
                  </div>

                  {!automatedSession ? (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Choose Gateway Provider
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAutomatedGateway('easypaisa')}
                          className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            automatedGateway === 'easypaisa'
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                              : 'border-border/60 text-muted-foreground'
                          }`}
                        >
                          <Smartphone className="h-5 w-5" />
                          EasyPaisa Gateway
                        </button>

                        <button
                          type="button"
                          onClick={() => setAutomatedGateway('jazzcash')}
                          className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            automatedGateway === 'jazzcash'
                              ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm'
                              : 'border-border/60 text-muted-foreground'
                          }`}
                        >
                          <Smartphone className="h-5 w-5" />
                          JazzCash Gateway
                        </button>
                      </div>

                      <Button
                        type="button"
                        onClick={handleInitiateAutomated}
                        className="w-full h-11 text-xs font-semibold shadow-md shadow-primary/25"
                        disabled={isInitiatingAutomated}
                      >
                        {isInitiatingAutomated ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Initiating Gateway Handshake...
                          </span>
                        ) : (
                          <span>Initiate Automated Handshake &rarr;</span>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Active Automated Sandbox Handshake Panel */
                    <div className="p-4 rounded-xl border border-primary/30 bg-muted/40 space-y-4 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                        <span className="font-bold text-foreground">
                          {automatedSession.gateway.toUpperCase()} Sandbox Checkout Session
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          ID: {automatedSession.txId.slice(-8)}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-muted-foreground text-[11px]">
                        <div className="flex justify-between">
                          <span>Order ID:</span>
                          <span className="font-mono text-foreground font-semibold">
                            {automatedSession.orderId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gateway TxID:</span>
                          <span className="font-mono text-foreground font-semibold">
                            {automatedSession.txId}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground text-xs pt-1">
                          <span>Payable Amount:</span>
                          <span className="text-primary">{automatedSession.amount}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleSimulateAutomatedCallback(true)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                          disabled={isVerifyingAutomated}
                        >
                          {isVerifyingAutomated ? 'Verifying Callback...' : 'Simulate Successful Authorization'}
                        </Button>
                        <Button
                          onClick={() => handleSimulateAutomatedCallback(false)}
                          variant="outline"
                          className="text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                          disabled={isVerifyingAutomated}
                        >
                          Simulate Failure
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE A: MANUAL TRANSFER */}
              {paymentMode === 'manual' && config && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      1. Select Manual Transfer Channel
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveMethod('jazzcash')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                          activeMethod === 'jazzcash'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Smartphone className="h-5 w-5 mb-1.5" />
                        JazzCash
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMethod('easypaisa')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                          activeMethod === 'easypaisa'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Smartphone className="h-5 w-5 mb-1.5" />
                        EasyPaisa
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMethod('bank_transfer')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                          activeMethod === 'bank_transfer'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Building className="h-5 w-5 mb-1.5" />
                        Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMethod('crypto')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                          activeMethod === 'crypto'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <CreditCard className="h-5 w-5 mb-1.5" />
                        USDT (TRC-20)
                      </button>
                    </div>
                  </div>

                  {/* Channel Details Box */}
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 text-xs">
                    {activeMethod === 'jazzcash' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account Title:</span>
                          <span className="font-semibold text-foreground">{config.jazzcash.accountTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">JazzCash Mobile / Till:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">
                              {config.jazzcash.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(config.jazzcash.accountNumber, 'jc_num')}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedField === 'jc_num' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          {config.jazzcash.instructions}
                        </p>
                      </div>
                    )}

                    {activeMethod === 'easypaisa' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account Title:</span>
                          <span className="font-semibold text-foreground">{config.easypaisa.accountTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">EasyPaisa Account:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">
                              {config.easypaisa.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(config.easypaisa.accountNumber, 'ep_num')}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedField === 'ep_num' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          {config.easypaisa.instructions}
                        </p>
                      </div>
                    )}

                    {activeMethod === 'bank_transfer' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-semibold text-foreground">{config.bankTransfer.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account Title:</span>
                          <span className="font-semibold text-foreground">{config.bankTransfer.accountTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">IBAN:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-foreground">
                              {config.bankTransfer.iban}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(config.bankTransfer.iban, 'iban')}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedField === 'iban' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMethod === 'crypto' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Network & Currency:</span>
                          <span className="font-semibold text-foreground">
                            {config.crypto.currency} ({config.crypto.network})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Exact Amount:</span>
                          <span className="font-mono font-bold text-foreground">
                            {config.crypto.amount}.00 USDT
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Wallet Address:</span>
                          <div className="flex items-center justify-between p-2 rounded bg-background border font-mono text-[11px] break-all">
                            <span>{config.crypto.walletAddress}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(config.crypto.walletAddress, 'wallet')}
                              className="ml-2 text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              {copiedField === 'wallet' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Submission Form */}
                  <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      2. Submit Verification Details
                    </p>

                    <FormField
                      label="Transaction Reference / TID"
                      required
                      hint="Enter the TID from EasyPaisa / JazzCash confirmation SMS or Bank Ref"
                    >
                      <Input
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 19283746502 or Bank Ref"
                        className="font-mono tracking-wider"
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField label="Receipt Image URL (Optional)" hint="Link to screenshot proof for instant admin audit">
                      <Input
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                        placeholder="https://imgur.com/... or receipt link"
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField label="Sender Mobile / Notes (Optional)">
                      <Input
                        value={senderInfo}
                        onChange={(e) => setSenderInfo(e.target.value)}
                        placeholder="e.g. Sent from 0300-XXXXXXX"
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
                          Submitting Proof...
                        </span>
                      ) : (
                        <span>Submit Payment for Verification &rarr;</span>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-6 border-t border-border/40 bg-muted/20 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Immutable Financial Audit Ledger
          </span>
          <Link to="/support" className="text-primary hover:underline flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Contact Financial Helpdesk
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
