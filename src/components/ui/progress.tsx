'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  /** Threshold tick marks in percent, e.g. [10, 25]. */
  ticks?: number[];
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, indicatorClassName, ticks, ...props }, ref) => (
    <ProgressPrimitive.Root ref={ref} value={value} className={cn('relative h-1.5 w-full rounded-full bg-line-faint', className)} {...props}>
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <ProgressPrimitive.Indicator className={cn('h-full w-full rounded-full bg-cyan transition-transform duration-500', indicatorClassName)}
          style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value ?? 0))}%)` }} />
      </div>
      {ticks?.map(t => <span key={t} aria-hidden className="absolute -inset-y-[3px] w-px bg-[#3A4E6B]" style={{ left: `${t}%` }} />)}
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
