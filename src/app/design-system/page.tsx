import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Droplets, OctagonAlert, Pause, Settings2, TrendingDown, X } from 'lucide-react';
import { Wordmark } from '@/components/lq/icons';
import { SectionLabel, STATUS, OUTCOME } from '@/components/lq/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Design System' };

const COLORS = [
  ['Deep space', '#070B14', 'App background'], ['Surface', '#0D1422', 'Cards, panels'], ['Elevated', '#121D2E', 'Wells, icon tiles'], ['Border', '#243247', 'Dividers'],
  ['Primary cyan', '#5DE1FF', 'Active systems, primary actions'], ['Secondary blue', '#739CFF', 'Shielding, morale'], ['Text primary', '#F3F7FC', 'Headings, values'],
  ['Text secondary', '#91A0B7', 'Labels'], ['Success', '#57D9A3', 'Stable systems'], ['Warning', '#FFC66D', 'Risk'], ['Critical', '#FF6B78', 'Critical only'],
];
const TYPE = [
  ['Display', '600 · 64–104 · −3.5%', 'text-[56px] font-semibold tracking-[-.035em]', 'YOUR MISSION.'],
  ['H1', '600 · 36–58 · −3%', 'text-[40px] font-semibold tracking-[-.03em]', 'Lunar Outpost — Alpha'],
  ['H2', '600 · 22–34 · −2%', 'text-[26px] font-semibold tracking-[-.02em]', 'Solar Storm Warning'],
  ['Value', '600 · 24–30 · tabular', 'tnum text-[30px] font-semibold tracking-[-.02em]', '247.6 / 400 L'],
  ['Body', '400 · 14–17 · 1.6 lh', 'text-base', 'Recycling slows water loss, but it cannot create water.'],
  ['Label', 'Mono 500 · 10–12 · +14% caps', 'label text-ink', 'Mission status · Day 06'],
];

const H = ({ id, children }: { id: string; children: React.ReactNode }) => <SectionLabel className="mb-5"><h2 id={id}>{children}</h2></SectionLabel>;

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line-faint px-5 py-4 md:px-12">
        <Link href="/"><Wordmark /></Link><SectionLabel className="text-[11px]">Design system · v1.0</SectionLabel>
      </header>
      <main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-5 pb-32 pt-12 md:px-12">
        <div className="max-w-[760px]">
          <h1 className="mb-3.5 text-[clamp(34px,4.4vw,56px)] font-semibold leading-none tracking-[-.035em]">Mission-grade, not mission-themed.</h1>
          <p className="text-[17px] leading-relaxed text-ink-muted">Legibility over decoration · color carries meaning and is always paired with an icon or label · glow only on the single most important element · numbers are tabular.</p>
        </div>

        <section aria-labelledby="c"><H id="c">01 — Color</H>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {COLORS.map(([n, hex, u]) => (
              <div key={hex} className="overflow-hidden rounded-xl border border-line-soft bg-surface">
                <div className="h-[72px] border-b border-line-soft" style={{ background: hex }} />
                <div className="px-3 py-2.5"><div className="text-[13px] font-medium">{n}</div><div className="mt-0.5 font-mono text-[11px] text-ink-muted">{hex}</div><div className="mt-1 text-[11.5px] text-ink-faint">{u}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="t"><H id="t">02 — Typography · Geist + Geist Mono</H>
          <div className="rounded-[14px] border border-line-soft bg-surface">
            {TYPE.map(([n, spec, cls, sample]) => (
              <div key={n} className="grid grid-cols-[minmax(120px,180px)_1fr] items-baseline gap-5 border-b border-line-faint px-5 py-4 last:border-0">
                <div className="font-mono text-[11px] leading-normal text-ink-muted">{n}<br /><span className="text-ink-faint">{spec}</span></div>
                <div className={cn('min-w-0 leading-tight [overflow-wrap:anywhere]', cls)}>{sample}</div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ctl"><H id="ctl">03 — Controls</H>
          <div className="flex flex-col gap-4 rounded-[14px] border border-line-soft bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button>PRIMARY <ArrowRight /></Button><Button className="bg-cyan-hover">HOVER</Button><Button className="outline outline-2 outline-offset-[3px] outline-cyan">FOCUS</Button><Button disabled>DISABLED</Button>
              <Button variant="secondary">SECONDARY</Button><Button variant="outline">OUTLINE</Button><Button variant="destructive">Destructive</Button>
              <Button variant="secondary" size="icon" aria-label="Settings"><Settings2 /></Button><Button variant="secondary" size="icon" aria-label="Pause" className="border-cyan text-cyan"><Pause /></Button>
            </div>
            <div className="flex flex-wrap gap-2.5"><Badge variant="stable"><CheckCircle2 />Nominal</Badge><Badge variant="warning"><AlertTriangle />Caution</Badge><Badge variant="critical"><OctagonAlert />Critical</Badge><Badge>Primary mission</Badge></div>
          </div>
        </section>

        <section aria-labelledby="d"><H id="d">04 — Resource card states</H>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-3">
            {([['stable', 298, 74, 'Falling · 37 days left'], ['warning', 62, 15, 'Falling · 7 days left'], ['critical', 21, 5, 'Falling · 2 days left']] as const).map(([st, v, p, t]) => {
              const S = STATUS[st];
              return (
                <article key={st} className={cn('flex flex-col gap-2.5 rounded-xl border bg-surface px-4 py-3.5', S.border)}>
                  <div className="flex items-center gap-2"><Droplets className="size-4 text-ink-muted" /><span className="label flex-1 text-ink-2">Water · {st}</span><span className={cn('flex items-center gap-1.5 text-[11.5px] font-medium', S.text)}><S.icon className="size-3.5" />{S.label}</span></div>
                  <div className="flex items-baseline gap-1.5"><span className="tnum text-[30px] font-semibold">{v}</span><span className="text-[13px] text-ink-muted">/ 400 L</span></div>
                  <Progress value={p} ticks={[10, 25]} indicatorClassName={S.fill} aria-label={`Water ${p}%`} />
                  <div className={cn('flex items-center gap-1.5 border-t border-line-faint pt-2 text-xs', S.text)}><TrendingDown className="size-3.5" />{t}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="f"><H id="f">05 — Outcomes</H>
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(OUTCOME) as (keyof typeof OUTCOME)[]).map(k => { const O = OUTCOME[k]; return (
              <div key={k} className="overflow-hidden rounded-[14px] border border-line-soft bg-surface">
                <div className={cn('h-[3px]', O.border.replace('border-', 'bg-'))} />
                <div className="flex gap-3 p-4"><span className={cn('grid size-9 shrink-0 place-items-center rounded-full border-[1.5px]', O.border, O.text)}><O.icon className="size-[17px]" /></span>
                  <div><div className={cn('label mb-1.5 font-semibold', O.text)}>{O.label}</div><div className="text-[13px] text-ink-muted">Color, icon and label together — never color alone.</div></div></div>
              </div>
            ); })}
          </div>
        </section>

        <section aria-labelledby="s"><H id="s">06 — Empty · loading · disabled · error</H>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-dashed border-line-strong p-6 text-center text-[13px] text-ink-muted"><div className="mb-1 font-medium text-ink">No events yet</div>Advance the mission to start building a history.</div>
            <div aria-busy className="flex flex-col gap-2.5 rounded-xl border border-line-soft bg-surface p-4">
              <div className="h-3 w-2/5 animate-shimmer rounded bg-[linear-gradient(90deg,#121D2E_0,#1B2B42_50%,#121D2E_100%)] bg-[length:400px_100%]" />
              <div className="h-7 w-3/5 animate-shimmer rounded bg-[linear-gradient(90deg,#121D2E_0,#1B2B42_50%,#121D2E_100%)] bg-[length:400px_100%]" />
              <div className="text-xs text-ink-faint">Loading telemetry…</div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-line-soft bg-surface p-4 opacity-60"><span className="font-medium text-ink-2">Greenhouse L3</span><span className="text-[13px] text-critical-soft">Need 12 more credits</span><Button size="sm" disabled>Upgrade</Button></div>
            <div role="alert" className="flex flex-col gap-2.5 rounded-xl border border-critical/40 bg-surface p-4"><span className="flex items-center gap-2 font-semibold text-critical"><X className="size-4" />Couldn’t load your save</span><span className="text-[13px] text-ink-2">Browser storage is unavailable. Progress won’t be kept.</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
