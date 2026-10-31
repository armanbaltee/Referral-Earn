import * as React from 'react';
import { cn } from '@lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2.5 text-sm shadow-xs',
          'placeholder:text-muted-foreground',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          error ? 'border-destructive focus:ring-destructive/40' : 'border-input',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
