'use client';

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

const ToggleGroup = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <ToggleGroupPrimitive.Root ref={ref} className={cn('flex gap-0.5 rounded-lg border border-line-soft bg-well p-0.5', className)} {...props} />
  ),
);
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <ToggleGroupPrimitive.Item ref={ref}
      className={cn('h-7 rounded-md px-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink data-[state=on]:bg-[#1B2B42] data-[state=on]:text-ink', className)}
      {...props} />
  ),
);
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
