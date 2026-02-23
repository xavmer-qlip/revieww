import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  className,
  children,
  hover = false,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-border/50 shadow-sm',
        paddings[padding],
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
