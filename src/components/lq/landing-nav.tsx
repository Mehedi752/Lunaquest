'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wordmark } from './icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [['How It Works', '#how'], ['Missions', '/missions'], ['Science Lab', '/science'], ['About the Challenge', '#about']];
  return (
    <nav aria-label="Primary"
      className={cn('fixed inset-x-0 top-0 z-50 flex items-center gap-7 border-b px-5 py-4 backdrop-blur-md transition-colors md:px-14',
        scrolled ? 'border-line-faint bg-space/85' : 'border-transparent bg-transparent')}>
      <Link href="/" aria-label="LunaQuest home"><Wordmark size={30} /></Link>
      <div className="hidden flex-1 flex-wrap justify-center gap-x-6 gap-y-1 text-sm md:flex">
        {links.map(([l, h]) => <Link key={h} href={h} className="text-ink-muted hover:text-ink">{l}</Link>)}
      </div>
      <div className="flex-1 md:hidden" />
      <Link href="/missions" className={cn(buttonVariants({ size: 'sm' }), 'tracking-[.04em]')}>START MISSION</Link>
    </nav>
  );
}
