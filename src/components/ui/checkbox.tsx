'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root ref={ref}
      className={cn('peer size-5 shrink-0 rounded-[5px] border-[1.5px] border-[#3A4E6B] data-[state=checked]:border-cyan data-[state=checked]:bg-cyan data-[state=checked]:text-cyan-ink', className)}
      {...props}>
      <CheckboxPrimitive.Indicator className="flex items-center justify-center"><Check className="size-3.5" strokeWidth={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
