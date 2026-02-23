import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text font-display"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full px-4 py-3 rounded-2xl bg-surface border border-border',
              'text-text font-body text-sm',
              'placeholder:text-text-muted/60',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-danger focus:ring-danger/30 focus:border-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger font-body">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
