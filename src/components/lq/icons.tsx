import {
  Battery, Droplets, Home, HeartPulse, Package, Shield, Sprout, Sun, Wind, Zap, type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/lib/sim';
import { cn } from '@/lib/utils';

export const ICONS: Record<IconName, LucideIcon> = {
  sun: Sun, battery: Battery, shield: Shield, droplets: Droplets, sprout: Sprout, wind: Wind,
  package: Package, zap: Zap, heart: HeartPulse, home: Home,
};

export function SimIcon({ name, className }: { name: IconName; className?: string }) {
  const I = ICONS[name];
  return <I aria-hidden className={cn('size-4', className)} strokeWidth={1.75} />;
}

/** LunaQuest orbital emblem — crescent Moon with an inclined orbit and satellite. */
export function Emblem({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <circle cx="16" cy="16" r="7.5" fill="#F3F7FC" />
      <circle cx="18.6" cy="14" r="6.4" fill="#070B14" />
      <ellipse cx="16" cy="16" rx="14" ry="5.2" transform="rotate(-24 16 16)" stroke="#5DE1FF" strokeWidth="1.4" />
      <circle cx="28.2" cy="10.6" r="1.8" fill="#5DE1FF" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 font-semibold text-ink">
      <Emblem size={size} />
      <span>LunaQuest</span>
    </span>
  );
}
