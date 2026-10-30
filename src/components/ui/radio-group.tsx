'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(
  ({ className, ...props }, ref) => <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2.5', className)} {...props} />,
);
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/** Card-style radio option used for event decisions. */
const RadioCard = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <RadioGroupPrimitive.Item ref={ref}
      className={cn(
        'group flex w-full flex-col gap-2.5 rounded-xl border-[1.5px] border-line bg-well px-4 py-3.5 text-left transition-colors hover:border-cyan',
        'data-[state=checked]:border-cyan data-[state=checked]:bg-cyan/[.06] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line',
        className,
      )}
      {...props}>
      {children}
    </RadioGroupPrimitive.Item>
  ),
);
RadioCard.displayName = 'RadioCard';

/** The dot indicator, rendered inside a RadioCard. */
const RadioDot = () => (
  <span className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#3A4E6B] group-data-[state=checked]:border-cyan">
    <span className="size-2 rounded-full group-data-[state=checked]:bg-cyan" />
  </span>
);

export { RadioGroup, RadioCard, RadioDot };
