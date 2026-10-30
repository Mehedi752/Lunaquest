import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { Wordmark } from './icons';
import { cn } from '@/lib/utils';

const STEPS = ['Mission', 'Briefing', 'Configure', 'Command'];

/** Header for the pre-mission setup flow (select → briefing → configure). */
export function SetupHeader({ step, back }: { step: 0 | 1 | 2; back?: { href: string; label: string } }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-line-faint bg-space/90 px-5 py-3.5 backdrop-blur-md md:px-12">
      <Link href="/" aria-label="LunaQuest home"><Wordmark /></Link>
      <ol aria-label="Mission setup progress" className="flex flex-1 flex-wrap justify-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[.12em]">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}
            className={cn('flex items-center gap-2 rounded-full border px-3 py-2',
              i === step ? 'border-cyan text-cyan' : i < step ? 'border-line-strong text-ink-muted' : 'border-line-soft text-ink-faint')}>
            <span>{String(i + 1).padStart(2, '0')}</span>{label}
          </li>
        ))}
      </ol>
      {back ? (
        <Link href={back.href} className="flex items-center gap-1.5 text-[13px] text-ink-muted"><ArrowLeft className="size-4" />{back.label}</Link>
      ) : (
        <Link href="/" className="flex items-center gap-1.5 text-[13px] text-ink-muted"><X className="size-4" />Exit</Link>
      )}
    </header>
  );
}
