import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, KeySquare } from 'lucide-react';

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
import { resetPasswordSchema, type ResetPasswordFormData } from '../auth.types';
import { authApi } from '../auth.api';

export default function ResetPasswordPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-muted' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-muted' };
    }
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Reset token is missing or invalid. Please request a new password reset link.');
      return;
    }

    setServerError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(data);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setServerError(axError.response?.data?.message || 'Invalid or expired password reset token.');
      } else {
        setServerError('Connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan-500 to-primary" />
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
          <KeySquare className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
        <CardDescription className="text-sm">
          Choose a strong, unique password to secure your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Password Reset Successfully</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your password has been updated and all previous sessions have been invalidated for security.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full text-xs mt-3 gap-1.5"
            >
              Sign In with New Password <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            {!token && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>No reset token detected in URL. Please click the link received in your email.</span>
              </div>
            )}

            {serverError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('token')} value={token} />

              {/* New Password */}
              <FormField label="New Password" required error={errors.password?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="space-y-1.5 -mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className="font-medium text-foreground">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <FormField label="Confirm New Password" required error={errors.confirmPassword?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/25 mt-2"
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating Password...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Reset Password <ArrowRight className="h-4 w-4" />
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
          Remember your password? Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
