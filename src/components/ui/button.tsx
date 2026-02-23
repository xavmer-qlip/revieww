import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40',
  secondary:
    'bg-secondary text-white hover:bg-secondary-light shadow-lg shadow-secondary/25',
  outline:
    'border-2 border-border text-text hover:border-primary hover:text-primary bg-transparent',
  ghost: 'text-text-muted hover:text-text hover:bg-black/5 bg-transparent',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-lg shadow-danger/25',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-sm rounded-2xl',
  lg: 'px-8 py-4 text-base rounded-2xl',
  xl: 'px-10 py-5 text-lg rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-display font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer',
          'hover:scale-[1.02] active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variants[variant],
          buttonSizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
