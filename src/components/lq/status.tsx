import { AlertTriangle, CheckCircle2, OctagonAlert, type LucideIcon } from 'lucide-react';
import type { OutcomeTone, Status, Tone } from '@/lib/sim';
import { cn } from '@/lib/utils';

/** Status is always communicated with color + icon + text (never color alone). */
export const STATUS: Record<Status, { label: string; icon: LucideIcon; text: string; bg: string; border: string; fill: string }> = {
  stable: { label: 'Stable', icon: CheckCircle2, text: 'text-success', bg: 'bg-success/10', border: 'border-line-soft', fill: 'bg-success' },
  warning: { label: 'Warning', icon: AlertTriangle, text: 'text-warning', bg: 'bg-warning/[.06]', border: 'border-warning/40', fill: 'bg-warning' },
  critical: { label: 'Critical', icon: OctagonAlert, text: 'text-critical', bg: 'bg-critical/[.07]', border: 'border-critical/55', fill: 'bg-critical' },
};

export const TONE: Record<Tone, string> = {
  good: 'bg-success/10 text-success',
  warn: 'bg-warning/[.08] text-warning',
  bad: 'bg-critical/10 text-critical-soft',
};

export const OUTCOME: Record<OutcomeTone, { label: string; icon: LucideIcon; text: string; border: string; bg: string }> = {
  success: { label: 'Good outcome', icon: CheckCircle2, text: 'text-success', border: 'border-success', bg: 'bg-success/[.05]' },
  warning: { label: 'Mixed outcome', icon: AlertTriangle, text: 'text-warning', border: 'border-warning', bg: 'bg-warning/[.04]' },
  failure: { label: 'Poor outcome', icon: OctagonAlert, text: 'text-critical', border: 'border-critical', bg: 'bg-critical/[.05]' },
};

export function StatusLabel({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const S = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11.5px] font-medium', S.text, className)}>
      <S.icon className="size-3.5" aria-hidden />
      {label ?? S.label}
    </span>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('label text-xs tracking-[.16em] text-cyan', className)}>{children}</div>;
}
