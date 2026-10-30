import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, LayoutDashboard } from 'lucide-react';
import { Wordmark } from '@/components/lq/icons';
import { SectionLabel } from '@/components/lq/status';
import { buttonVariants } from '@/components/ui/button';
import { MODULES } from './modules';
import { ModuleFigure } from './figures';

export const metadata: Metadata = { title: 'Science Lab' };

export default function SciencePage() {
  return (
    <div className="min-h-screen scroll-smooth">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line-faint bg-space/90 px-5 py-3.5 backdrop-blur-md md:px-12">
        <Link href="/" aria-label="LunaQuest home"><Wordmark /></Link>
        <SectionLabel className="text-[11px] tracking-label">Science Lab</SectionLabel>
        <div className="flex-1" />
        <Link href="/sources" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>Science &amp; Data Sources</Link>
        <Link href="/mission" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><LayoutDashboard />Back to Mission Control</Link>
      </header>

      <div className="mx-auto px-5 pb-24 pt-[clamp(36px,5vw,64px)] md:px-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="mb-3.5 text-[clamp(34px,4.4vw,58px)] font-semibold leading-none tracking-[-.035em]">The engineering behind the game</h1>
            <p className="text-[17px] leading-relaxed text-ink-muted">Seven short modules. Each one asks a question, shows how LunaQuest models the answer, and points to how real missions handle it.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <span className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"><span className="size-2 rounded-sm bg-cyan" />Game model (simplified)</span>
            <span className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"><span className="size-2 rounded-full bg-success" />Real-world practice</span>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-8">
          <nav aria-label="Modules" className="flex max-w-full flex-[1_1_220px] flex-col gap-0.5 lg:sticky lg:top-[84px]">
            {MODULES.map((m, i) => (
              <a key={m.id} href={`#${m.id}`} className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm text-ink-2 hover:bg-surface hover:text-ink">
                <span className="font-mono text-[11px] text-cyan">{String(i + 1).padStart(2, '0')}</span><m.icon className="size-4 text-ink-muted" />{m.title}
              </a>
            ))}
          </nav>

          <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
            {MODULES.map((m, i) => (
              <article key={m.id} id={m.id} aria-labelledby={`h-${m.id}`} className="scroll-mt-[90px] overflow-hidden rounded-2xl border border-line-soft bg-surface">
                <div className="flex flex-col gap-4 p-[clamp(22px,3vw,36px)]">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-[10px] border border-cyan/25 bg-cyan/[.08] text-cyan"><m.icon className="size-5" /></span>
                    <span className="label">Module {String(i + 1).padStart(2, '0')} · {m.tag}</span>
                  </div>
                  <h2 id={`h-${m.id}`} className="text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.1] tracking-[-.02em] text-balance">{m.question}</h2>
                  <p className="max-w-[760px] text-base leading-[1.65] text-ink-2 text-pretty">{m.explain}</p>
                </div>
                <figure className="border-y border-line-soft bg-well p-[clamp(20px,3vw,32px)]">
                  <ModuleFigure id={m.id} />
                  <figcaption className="mt-3.5 font-mono text-[10.5px] tracking-[.1em] text-ink-faint">{m.figcap}</figcaption>
                </figure>
                <div className="grid gap-px bg-line-soft sm:grid-cols-2">
                  <div className="bg-surface px-6 py-5"><div className="label mb-2.5 flex items-center gap-2 text-cyan"><span className="size-[7px] rounded-sm bg-cyan" />In the game</div><p className="text-sm leading-relaxed text-ink-2">{m.game}</p></div>
                  <div className="bg-surface px-6 py-5"><div className="label mb-2.5 flex items-center gap-2 text-success"><span className="size-[7px] rounded-full bg-success" />In the real world</div><p className="text-sm leading-relaxed text-ink-2">{m.real}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-line-soft px-6 py-3.5 text-[12.5px]">
                  <span className="flex items-center gap-1.5 text-[#C9B48D]"><AlertTriangle className="size-3.5 text-warning" />Simplification: {m.simplify}</span>
                  <div className="flex-1" />
                  {m.source && <a href={m.source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">{m.source.label}<ExternalLink className="size-3" /></a>}
                </div>
              </article>
            ))}
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">LunaQuest is an educational game. Its numbers are simplified gameplay parameters and must not be used to design real spacecraft or protect real astronauts. Not affiliated with or endorsed by NASA.</p>
          </main>
        </div>
      </div>
    </div>
  );
}
