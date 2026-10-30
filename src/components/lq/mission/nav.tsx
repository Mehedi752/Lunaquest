'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, History, LayoutDashboard, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/mission', label: 'Overview', icon: LayoutDashboard },
  { href: '/mission/build', label: 'Build', icon: Wrench },
  { href: '/mission/timeline', label: 'Timeline', icon: History },
];

/** Left rail on ≥ md; horizontal tab strip below md. */
export function MissionNav({ variant }: { variant: 'rail' | 'strip' }) {
  const path = usePathname();
  const items = [...ITEMS, { href: '/science', label: 'Science', icon: FlaskConical }];
  if (variant === 'rail') {
    return (
      <nav aria-label="Mission sections" className="sticky top-14 hidden h-[calc(100vh-56px)] w-[76px] shrink-0 flex-col items-center gap-1 border-r border-line-soft bg-well py-3 md:flex">
        {items.map((n, i) => {
          const on = path === n.href;
          return (
            <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined}
              className={cn('flex w-[62px] flex-col items-center gap-1.5 rounded-[10px] py-2.5 text-[10.5px] font-medium transition-colors hover:bg-elevated hover:text-ink',
                on ? 'bg-[#132235] text-cyan' : 'text-ink-muted', i === items.length - 1 && 'mt-auto')}>
              <n.icon className="size-5" strokeWidth={1.75} />{n.label}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label="Mission sections" className="flex gap-1 overflow-x-auto border-b border-line-soft bg-well px-3 py-2 md:hidden">
      {items.map(n => {
        const on = path === n.href;
        return (
          <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined}
            className={cn('flex h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium', on ? 'bg-[#132235] text-cyan' : 'text-ink-muted')}>
            <n.icon className="size-4" />{n.label}
          </Link>
        );
      })}
    </nav>
  );
}
