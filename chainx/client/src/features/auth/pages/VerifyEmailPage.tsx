import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, MailCheck, Loader2 } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { authApi } from '../auth.api';
import { useAuthStore } from '@store/auth.store';

export default function VerifyEmailPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [accountStatus, setAccountStatus] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function executeVerification() {
      if (!token) {
        setIsLoading(false);
        setMessage('No verification token provided in URL. Please check your verification link.');
        return;
      }

      try {
        const response = await authApi.verifyEmail({ token });
        if (isMounted) {
          setIsSuccess(true);
          setMessage(response.message);
          setAccountStatus(response.user.accountStatus);
          updateUser({ isEmailVerified: true, accountStatus: response.user.accountStatus });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsSuccess(false);
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const axError = err as { response?: { data?: { message?: string } } };
            setMessage(axError.response?.data?.message || 'Invalid or expired email verification token.');
          } else {
            setMessage('Network error. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token, updateUser]);

  return (
    <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden text-center">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-primary to-cyan-500" />
      <CardHeader className="space-y-1.5 pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          <MailCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Email Verification</CardTitle>
        <CardDescription className="text-sm">
          Confirming your email address for secure affiliate payouts and notifications
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Validating token and verifying email...</p>
          </div>
        )}

        {!isLoading && isSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Email Successfully Verified!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
            {accountStatus === 'pending_payment' ? (
              <Button
                onClick={() => navigate('/register-payment')}
                className="w-full text-xs mt-3 gap-1.5"
              >
                Proceed to Registration Fee Payment <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full text-xs mt-3 gap-1.5"
              >
                Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isSuccess && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Verification Failed</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
            <Link to="/login">
              <Button variant="outline" className="w-full text-xs mt-3">
                Return to Sign In
              </Button>
            </Link>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-6 border-t border-border/40 bg-muted/20 justify-center">
        <Link
          to="/login"
          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
