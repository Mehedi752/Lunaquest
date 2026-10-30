import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-mono text-[11px] font-medium uppercase leading-none tracking-[.12em] [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'border-cyan/40 bg-cyan/15 text-cyan',
        stable: 'border-success/40 bg-success/10 text-success',
        warning: 'border-warning/40 bg-warning/10 text-warning',
        critical: 'border-critical/40 bg-critical/10 text-critical',
        neutral: 'border-line-strong bg-space/70 text-ink-2',
      },
      size: { default: 'h-7 px-2.5', sm: 'h-6 px-2' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
