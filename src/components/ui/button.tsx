import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-cyan text-cyan-ink hover:bg-cyan-hover disabled:bg-line-faint disabled:text-ink-faint',
        secondary: 'border border-line-strong bg-transparent font-medium text-ink hover:border-cyan disabled:text-ink-faint',
        ghost: 'font-medium text-ink-muted hover:bg-elevated hover:text-ink',
        destructive: 'bg-critical text-[#1A0508] hover:bg-critical-soft',
        outline: 'border border-cyan bg-transparent text-cyan hover:bg-cyan/10',
        link: 'text-cyan underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3 text-[13px]',
        lg: 'h-[52px] px-6 tracking-[.06em]',
        icon: 'h-9 w-9 rounded-lg border border-line text-ink-2 hover:border-cyan',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
