import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
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
import { registerSchema, type RegisterFormData } from '../auth.types';
import { authApi } from '../auth.api';

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralParam = searchParams.get('ref') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      referralCode: referralParam,
      termsAccepted: false as unknown as true,
    },
  });

  const passwordValue = watch('password') || '';

  // Calculate password strength indicator
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
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

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await authApi.register(data);
      // Registration successful: Redirect to payment page with user reference & fee details
      navigate('/register-payment', {
        state: {
          user: response.data.user,
          registrationFee: response.data.registrationFee,
          message: 'Account registered successfully! Complete your Rs. 15,000 registration fee to activate your account.',
        },
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setServerError(axError.response?.data?.message || 'Registration failed. Please check your details.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan-500 to-emerald-500" />
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" /> Step 1 of 2
          </span>
        </div>
        <CardDescription className="text-sm">
          Join ChainX enterprise affiliate network and start generating multi-tier earnings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Registration Fee Notice Banner */}
        <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-sm text-foreground">
                Registration Fee: Rs. 15,000
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Accounts are created in <span className="font-medium text-foreground">Pending Payment</span> status.
                Your affiliate code and commissions will activate once your payment verification is completed.
              </p>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <FormField label="Full Name" required error={errors.name?.message}>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('name')}
                placeholder="Muhammad Ali"
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
          </FormField>

          {/* Email Address */}
          <FormField label="Email Address" required error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('email')}
                type="email"
                placeholder="ali@example.com"
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
          </FormField>

          {/* Phone Number */}
          <FormField
            label="Phone Number"
            required
            error={errors.phone?.message}
            hint="Format: 03001234567 or +923001234567"
          >
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('phone')}
                placeholder="03001234567"
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
          </FormField>

          {/* Password */}
          <FormField
            label="Password"
            required
            error={errors.password?.message}
          >
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
          <FormField
            label="Confirm Password"
            required
            error={errors.confirmPassword?.message}
          >
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

          {/* Referral Code (Optional) */}
          <FormField
            label="Referral Code (Optional)"
            error={errors.referralCode?.message}
            hint="Leave blank if you were not invited by an existing partner"
          >
            <div className="relative">
              <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('referralCode')}
                placeholder="CHX-ABC123"
                className="pl-9 font-mono uppercase tracking-wider"
                disabled={isSubmitting}
              />
            </div>
          </FormField>

          {/* Terms Acceptance */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                {...register('termsAccepted')}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                disabled={isSubmitting}
              />
              <span>
                I have read and agree to the{' '}
                <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>,{' '}
                <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>, and understand
                the <strong className="text-foreground">Rs. 15,000 non-refundable registration fee</strong> required for account activation.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-destructive">{errors.termsAccepted.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-4 h-11 text-sm font-semibold shadow-md shadow-primary/25"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue to Payment <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2 pb-6 border-t border-border/40 bg-muted/20">
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 256-bit SSL Security
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Verified Platform
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
