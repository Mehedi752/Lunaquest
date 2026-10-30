import type { Metadata } from 'next';
import Link from 'next/link';
import { FlaskConical, LayoutDashboard } from 'lucide-react';
import { Wordmark } from '@/components/lq/icons';
import { SectionLabel } from '@/components/lq/status';
import { buttonVariants } from '@/components/ui/button';
import { SourcesView } from './sources-view';

export const metadata: Metadata = { title: 'Science & Data Sources' };

export default function SourcesPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line-faint bg-space/90 px-5 py-3.5 backdrop-blur-md md:px-12">
        <Link href="/" aria-label="LunaQuest home"><Wordmark /></Link>
        <SectionLabel className="text-[11px] tracking-label">Science &amp; Data Sources</SectionLabel>
        <div className="flex-1" />
        <nav aria-label="Pages" className="flex flex-wrap gap-2">
          <Link href="/science" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><FlaskConical />Science Lab</Link>
          <Link href="/mission" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><LayoutDashboard />Mission Control</Link>
        </nav>
      </header>
      <SourcesView />
    </div>
  );
}
