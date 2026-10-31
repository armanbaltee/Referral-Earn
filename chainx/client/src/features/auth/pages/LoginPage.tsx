import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
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
import { loginSchema, type LoginFormData } from '../auth.types';
import { authApi } from '../auth.api';
import { useAuthStore, UserRole } from '@store/auth.store';

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if routed with special status or message
  const statusMessage = (location.state as { message?: string } | null)?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await authApi.login(data);
      const { user, accessToken, accountStatus } = response.data;

      // Update Zustand auth store
      setAuth(user, accessToken);

      // Handle account status routing
      if (accountStatus === 'pending_payment') {
        navigate('/register-payment', {
          replace: true,
          state: {
            user,
            message: 'Your registration payment of Rs. 15,000 is pending. Please complete your payment.',
          },
        });
        return;
      }

      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setServerError(axError.response?.data?.message || 'Invalid credentials or account suspended.');
      } else {
        setServerError('Network connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan-500 to-primary" />
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription className="text-sm">
          Sign in with your email and password to access your dashboard
        </CardDescription>
      </CardHeader>

      <CardContent>
        {statusMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Address */}
          <FormField label="Email Address" required error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </FormField>

          {/* Password */}
          <FormField label="Password" required error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-9 pr-10"
                disabled={isSubmitting}
                autoComplete="current-password"
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                disabled={isSubmitting}
              />
              <span>Remember me for 30 days</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full mt-4 h-11 text-sm font-semibold shadow-md shadow-primary/25"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In to Account <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2 pb-6 border-t border-border/40 bg-muted/20">
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register now
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> End-to-end Encrypted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Session Audited
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
