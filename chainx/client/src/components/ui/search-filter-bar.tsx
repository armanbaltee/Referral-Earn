import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { Input } from './input';
import { Button } from './button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{
    id: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function SearchFilterBar({
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filters = [],
  onResetFilters,
  hasActiveFilters = false,
  actions,
  className,
}: SearchFilterBarProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-sm',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            startIcon={<Search className="h-4 w-4" />}
            className="h-9 text-xs"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filters.map((filter) => (
          <div key={filter.id} className="relative min-w-[130px]">
            <select
              aria-label={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && onResetFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 self-end md:self-auto">{actions}</div>}
    </div>
  );
}
