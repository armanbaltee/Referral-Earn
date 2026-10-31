import * as React from 'react';
import { cn } from '@lib/utils';

/* ─── Label ────────────────────────────────────────────────────────────────── */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean | undefined;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive text-xs normal-case tracking-normal">*</span>}
    </label>
  )
);
Label.displayName = 'Label';

/* ─── Form Field Wrapper ─────────────────────────────────────────────────── */
export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
          <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
