import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@lib/utils';
import { Card } from './card';
import { Skeleton } from './misc';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changePeriod?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  currency?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changePeriod = 'vs last month',
  icon,
  iconBg = 'bg-primary/10 text-primary',
  trend,
  loading = false,
  className,
  ...props
}: StatCardProps): React.ReactElement {
  if (loading) {
    return (
      <Card className={cn('p-5 space-y-3', className)} {...props}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
      </Card>
    );
  }

  const computedTrend =
    trend ?? (change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : undefined);

  return (
    <Card
      className={cn(
        'p-5 transition-all duration-200 hover:shadow-card-hover border-border/80 group',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {icon && (
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </h3>
      </div>

      {(change !== undefined || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium',
                computedTrend === 'up' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                computedTrend === 'down' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                computedTrend === 'neutral' && 'bg-muted text-muted-foreground'
              )}
            >
              {computedTrend === 'up' && <ArrowUpRight className="h-3 w-3" />}
              {computedTrend === 'down' && <ArrowDownRight className="h-3 w-3" />}
              {computedTrend === 'neutral' && <Minus className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
          )}
          <span className="text-muted-foreground truncate">
            {subtitle || changePeriod}
          </span>
        </div>
      )}
    </Card>
  );
}

export interface FinancialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  amount: string | number;
  currency?: string;
  actionLabel?: string;
  onAction?: () => void;
  breakdown?: Array<{
    label: string;
    value: string | number;
  }>;
  variant?: 'primary' | 'card' | 'gradient';
}

export function FinancialSummaryCard({
  title,
  amount,
  currency = '$',
  actionLabel,
  onAction,
  breakdown = [],
  variant = 'card',
  className,
  ...props
}: FinancialCardProps): React.ReactElement {
  return (
    <Card
      className={cn(
        'p-6 relative overflow-hidden transition-all',
        variant === 'primary' &&
          'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700/60 shadow-xl',
        variant === 'gradient' &&
          'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-blue-500/40 shadow-xl',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            variant === 'card' ? 'text-muted-foreground' : 'text-slate-300'
          )}
        >
          {title}
        </span>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-md transition-colors',
              variant === 'card'
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold tracking-tight font-mono">
          {typeof amount === 'number'
            ? `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : amount}
        </div>
      </div>

      {breakdown.length > 0 && (
        <div
          className={cn(
            'mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-xs',
            variant === 'card' ? 'border-border text-muted-foreground' : 'border-white/10 text-slate-300'
          )}
        >
          {breakdown.map((item, idx) => (
            <div key={idx}>
              <div className="text-[11px] opacity-80">{item.label}</div>
              <div className="font-semibold text-foreground mt-0.5 font-mono">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
