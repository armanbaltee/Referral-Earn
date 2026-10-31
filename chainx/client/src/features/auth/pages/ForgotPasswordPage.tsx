import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

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
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../auth.types';
import { authApi } from '../auth.api';

export default function ForgotPasswordPage(): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submittedEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setServerError(axError.response?.data?.message || 'Failed to send password reset link.');
      } else {
        setServerError('Connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-cyan-500" />
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
        <CardDescription className="text-sm">
          Enter your registered email address and we will send you a password reset link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Reset Link Dispatched</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account with <strong className="text-foreground">{submittedEmail}</strong> exists,
              we have sent instructions to reset your password.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please check your inbox as well as your spam or promotions folder.
            </p>
          </div>
        ) : (
          <>
            {serverError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Registered Email" required error={errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    disabled={isSubmitting}
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/25 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Link <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-6 border-t border-border/40 bg-muted/20">
        <Link
          to="/login"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
