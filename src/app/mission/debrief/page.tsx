'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Award, Battery, Check, Droplets, FlaskConical, History, OctagonAlert, RotateCcw, Rocket, Shield, Sprout, Wind, Zap } from 'lucide-react';
import { useMissionCtx } from '@/components/lq/mission/shell';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMissionStore } from '@/lib/store';
import { CAPS, P, autoplay, batteryCap, score, type MissionState , daysOf} from '@/lib/sim';
import { cn, pad2 } from '@/lib/utils';

const ACH_ICON = { life: Wind, energy: Zap, conserve: Droplets, emergency: Shield, science: FlaskConical } as const;

export default function DebriefPage() {
  const router = useRouter();
  const { mission } = useMissionCtx();
  const restart = useMissionStore(s => s.restart);
  const mineDone = mission.status !== 'active';
  const samples = useMemo(() => ({ success: autoplay('success'), failure: autoplay('failure') }), []);
  const [src, setSrc] = useState<'mine' | 'success' | 'failure'>(mineDone ? 'mine' : 'success');
  const s: MissionState = src === 'mine' ? mission : samples[src];
  const sc = score(s);
  const ok = s.status === 'complete';
  const done = s.objectives.filter(o => o.done).length;
  const L = s.levels;

  const helped: string[] = [];
  if (L.oxygen) helped.push(`Oxygen generation (level ${L.oxygen}) slowed the drain on the oxygen tank.`);
  if (L.recycler) helped.push(`Water recycling at ${Math.round(P.recRate[L.recycler] * 100)}% kept most used water in the loop.`);
  if (L.battery >= 2) helped.push(`Upgrading battery storage to level ${L.battery} helped bridge the shadow period.`);
  if (L.greenhouse) helped.push('The greenhouse supplemented packaged food after its first harvest.');
  if (L.shielding) helped.push('A storm shelter reduced crew exposure during solar storms.');
  s.log.filter(l => l.type === 'repair').forEach(l => helped.push(l.text));

  const challenges = s.log.filter(l => l.type === 'decision' && l.text.includes(':')).map(l => {
    const [t, ...rest] = l.text.split(':');
    return { day: pad2(l.day), text: t, how: `You chose: ${rest.join(':').trim().replace(/\.$/, '')}.` };
  });
  if (s.brownoutDays) challenges.push({ day: '—', text: `${s.brownoutDays} day${s.brownoutDays > 1 ? 's' : ''} of power shortfall`, how: 'Loads were shed automatically to protect life support.' });

  const contributed: string[] = [], changes: string[] = [];
  if (!ok && s.failure) {
    if (s.failure.system === 'Oxygen' && !L.oxygen) { contributed.push('No oxygen generation was installed, so the crew lived off a finite tank.'); changes.push('Install Oxygen Generation level 1 (15 credits) — it covers most of the crew’s daily demand.'); }
    if (s.unsafe) { contributed.push(`${s.unsafe} solar storm${s.unsafe > 1 ? 's were' : ' was'} met with “continue normal operations”, raising crew exposure.`); changes.push('Shelter the crew when a storm arrives — science can wait a day.'); }
    if (!L.shielding) { contributed.push('No radiation shielding was purchased.'); changes.push('Even basic shielding halves storm hazard in the game.'); }
    if (s.brownoutDays) contributed.push(`${s.brownoutDays} days of power shortfall throttled life-support equipment.`);
    if (!contributed.length) contributed.push('Reserves declined faster than systems could replace them.');
    if (!changes.length) changes.push('Rebalance your budget toward the system that failed first.');
  }
  const lessons = [
    { text: 'Recycling slows resource loss — it never creates new water or air.', href: '/science#water' },
    { text: 'Every life-support system depends on reliable power, so energy storage protects everything else.', href: '/science#energy' },
    { text: 'Shielding and shelter procedures are only valuable if they are in place before the storm.', href: '/science#rad' },
  ];
  if (!ok && s.failure?.system === 'Oxygen') lessons.unshift({ text: 'Oxygen is the most time-critical resource: without generation, a fixed tank sets a hard deadline.', href: '/science#life' });

  const pctTotal = sc.total / 10;
  const N = daysOf(s), req = sc.required ?? 3, partial = ok && sc.result === 'partial';
  const ringColor = ok ? (partial ? '#FFC66D' : '#57D9A3') : '#FF6B78';
  const rem = (I: React.ElementType, k: string, v: number, cap: number, u: string) => ({ I, k, v: Math.round(v), u, p: (v / cap) * 100,
    c: v / cap < .1 ? 'bg-critical' : v / cap < .25 ? 'bg-warning' : 'bg-success' });
  const remaining = [rem(Wind, 'Oxygen', s.o2, CAPS.o2, 'kg'), rem(Droplets, 'Water', s.water, CAPS.water, 'L'), rem(Sprout, 'Food', s.food, CAPS.food, 'kg'), rem(Battery, 'Battery', s.battery, batteryCap(s), 'kWh')];

  return (
    <main data-screen-label="10 Mission Debrief" className="mx-auto flex max-w-[1280px] flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label">Mission debrief</span>
        <ToggleGroup type="single" value={src} onValueChange={v => v && setSrc(v as typeof src)} aria-label="Debrief source">
          <ToggleGroupItem value="mine" disabled={!mineDone}>My mission</ToggleGroupItem>
          <ToggleGroupItem value="success">Sample: success</ToggleGroupItem>
          <ToggleGroupItem value="failure">Sample: failure</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <section aria-labelledby="hd" className={cn('flex flex-wrap items-center justify-between gap-10 overflow-hidden rounded-[20px] border bg-surface p-[clamp(28px,4vw,48px)]',
        ok ? 'border-success/35 bg-[radial-gradient(ellipse_70%_120%_at_100%_0%,rgba(87,217,163,.10),transparent_60%)]' : 'border-critical/40 bg-[radial-gradient(ellipse_70%_120%_at_100%_0%,rgba(255,107,120,.10),transparent_60%)]')}>
        <div className="min-w-0 flex-[1_1_420px]">
          <div className={cn('mb-4 flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[.16em]', ok ? 'text-success' : 'text-critical')}>
            {ok ? <Award className="size-[18px]" /> : <OctagonAlert className="size-[18px]" />}{ok ? (partial ? 'Partial success' : 'Mission accomplished') : 'Mission aborted'}
          </div>
          <h1 id="hd" className="mb-3.5 text-[clamp(36px,5vw,64px)] font-semibold leading-none tracking-[-.035em]">
            {ok ? `${s.mission}: crew home safe.` : `${s.failure?.system} ran out on day ${s.failure?.day}.`}
          </h1>
          <p className="max-w-[560px] text-[17px] leading-relaxed text-ink-2 text-pretty">
            {ok ? `All four astronauts completed the ${N}-day mission. You finished ${done} science objective${done === 1 ? '' : 's'}${partial ? `, but ${req} were required` : ''} and handed a working outpost to the relief crew.`
              : 'The crew returned safely, but the outpost could not continue. Every failure is data — here is what happened and what to try next.'}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[['Crew', ok ? '4 / 4 safe' : 'Returned', ok ? 'text-success' : 'text-warning'], ['Duration', `${ok ? N : s.failure?.day ?? s.day} / ${N} days`, 'text-ink'],
              ['Objectives', `${done} / ${req} needed`, done >= req ? 'text-success' : 'text-warning'],
              ['Efficiency', `${Math.round(sc.minRatio * 100)}% min`, sc.minRatio >= .2 ? 'text-success' : sc.minRatio >= .1 ? 'text-warning' : 'text-critical']].map(([k, v, c]) => (
              <div key={k} className="bg-surface px-4 py-3.5"><dt className="mb-1.5 text-xs text-ink-muted">{k}</dt><dd className={cn('tnum text-[22px] font-semibold', c)}>{v}</dd></div>
            ))}
          </dl>
        </div>
        <div role="img" aria-label={`Mission score ${sc.total} of 1000`} className="grid size-[220px] shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${ringColor} 0 ${pctTotal}%, #172235 ${pctTotal}% 100%)` }}>
          <div className="flex size-[184px] flex-col items-center justify-center gap-1 rounded-full bg-[#0B111D]">
            <span className="label text-[10.5px]">Mission score</span>
            <span className="tnum text-[54px] font-semibold tracking-[-.03em]">{sc.total}</span>
            <span className="text-[13px] text-ink-muted">of 1,000 · {!ok ? 'Aborted' : sc.total >= 850 ? 'Outstanding' : sc.total >= 700 ? 'Strong' : sc.total >= 500 ? 'Developing' : 'Needs review'}</span>
          </div>
        </div>
      </section>

      {!ok && s.failure && (
        <section aria-label="Failure analysis" className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[14px] border border-critical/40 bg-surface p-5">
            <h2 className="label mb-3.5 font-semibold text-critical">What failed · when</h2>
            <div className="mb-1.5 text-[22px] font-semibold">{s.failure.system}</div>
            <div className="mb-3 text-sm text-ink-muted">Day {s.failure.day} of {N}</div>
            <p className="text-sm leading-relaxed text-ink-2">{s.failure.text}</p>
          </div>
          {[['Decisions that contributed', contributed, 'text-warning', AlertTriangle], ['What you could change', changes, 'text-cyan', ArrowRight]].map(([t, list, c, I]) => {
            const Icon = I as React.ElementType;
            return (
              <div key={t as string} className="rounded-[14px] border border-line-soft bg-surface p-5">
                <h2 className={cn('label mb-3.5 font-semibold', c as string)}>{t as string}</h2>
                <ul className="flex flex-col gap-2.5">{(list as string[]).map(x => <li key={x} className="flex gap-2.5 text-sm leading-normal text-ink-2"><Icon className={cn('mt-0.5 size-[15px] shrink-0', c as string)} />{x}</li>)}</ul>
              </div>
            );
          })}
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="sc" className="rounded-2xl border border-line-soft bg-surface">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4"><h2 id="sc" className="label text-ink-2">How your score was calculated</h2><span className="tnum font-semibold">{sc.total} / 1000</span></div>
          <ul className="px-5 pb-4 pt-2">
            {sc.cats.map(c => { const r = c.value / c.max; return (
              <li key={c.id} className="border-b border-line-faint py-3.5 last:border-0">
                <div className="mb-2 flex justify-between gap-3"><span className="font-medium">{c.label}</span><span className="tnum"><span className="font-semibold">{c.value}</span><span className="text-ink-faint"> / {c.max}</span></span></div>
                <Progress value={r * 100} indicatorClassName={r >= .7 ? 'bg-success' : r >= .4 ? 'bg-warning' : 'bg-critical'} className="mb-2" aria-label={c.label} />
                <div className="text-[12.5px] text-ink-muted">{c.basis}</div>
              </li>
            ); })}
          </ul>
          <p className="px-5 pb-4 text-[12.5px] leading-normal text-ink-faint">Unsafe choices never earn points, even when they save resources. A failed mission scores zero for resource margins.</p>
        </section>

        <section aria-labelledby="ac" className="rounded-2xl border border-line-soft bg-surface">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4"><h2 id="ac" className="label text-ink-2">Achievements</h2><span className="text-[13px] text-ink-muted">{sc.achievements.filter(a => a.earned).length} of 5 earned</span></div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 p-3">
            {sc.achievements.map(a => { const I = ACH_ICON[a.id as keyof typeof ACH_ICON]; return (
              <li key={a.id} className={cn('flex items-start gap-3 rounded-xl border p-3.5', a.earned ? 'border-cyan/35 bg-cyan/[.05]' : 'border-line-soft opacity-70')}>
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-full border-[1.5px]', a.earned ? 'border-cyan text-cyan' : 'border-[#3A4E6B] text-[#3A4E6B]')}><I className="size-[18px]" /></span>
                <span>
                  <span className="mb-1 block text-sm font-semibold">{a.name}</span>
                  <span className="block text-xs leading-snug text-ink-muted">{a.criterion}</span>
                  <span className={cn('label mt-1.5 block text-[10px]', a.earned ? 'text-cyan' : 'text-[#3A4E6B]')}>{a.earned ? 'Earned' : 'Not earned'}</span>
                </span>
              </li>
            ); })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="rr" className="rounded-2xl border border-line-soft bg-surface">
        <h2 id="rr" className="label border-b border-line-soft px-5 py-4 text-ink-2">Remaining resources</h2>
        <div className="grid grid-cols-2 gap-px bg-line-soft lg:grid-cols-4">
          {remaining.map(r => (
            <div key={r.k} className="bg-surface px-5 py-4">
              <div className="mb-2 flex items-center gap-2 text-[13px] text-ink-muted"><r.I className="size-[15px]" />{r.k}</div>
              <div className="tnum mb-2.5 text-2xl font-semibold">{r.v}<span className="text-[13px] font-normal text-ink-muted"> {r.u}</span></div>
              <Progress value={r.p} indicatorClassName={r.c} className="h-[5px]" aria-label={`${r.k} remaining`} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-line-soft bg-surface p-5">
          <h2 className="label mb-3.5 text-success">{ok ? 'Decisions that helped' : 'What worked'}</h2>
          <ul className="flex flex-col gap-3">{(helped.length ? helped : ['Every system you installed bought the crew time.']).slice(0, 5).map(h => <li key={h} className="flex gap-2.5 text-sm leading-normal text-ink-2"><Check className="mt-0.5 size-[15px] shrink-0 text-success" />{h}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-line-soft bg-surface p-5">
          <h2 className="label mb-3.5 text-warning">Challenges faced</h2>
          <ul className="flex flex-col gap-3">
            {(challenges.length ? challenges : [{ day: '—', text: 'No emergencies recorded', how: '' }]).map((c, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-normal text-ink-2"><span className="shrink-0 font-mono text-[11px] leading-6 text-ink-faint">D{c.day}</span><span>{c.text}<span className="block text-[13px] text-ink-muted">{c.how}</span></span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line-soft bg-surface p-5">
          <h2 className="label mb-3.5 text-cyan">Lessons &amp; science</h2>
          <ul className="flex flex-col gap-3">{lessons.slice(0, 3).map(l => <li key={l.href} className="flex gap-2.5 text-sm leading-normal text-ink-2"><FlaskConical className="mt-0.5 size-[15px] shrink-0 text-cyan" /><span>{l.text} <Link href={l.href} className="whitespace-nowrap">Science Lab →</Link></span></li>)}</ul>
        </section>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-3">
        <Link href="/mission/timeline" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-[50px]')}><History />REVIEW MISSION</Link>
        <Button size="lg" className="h-[50px]" onClick={() => { restart(); router.push('/mission'); }}><RotateCcw />TRY AGAIN</Button>
        <Link href="/missions" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-[50px]')}><Rocket />START NEW MISSION</Link>
      </div>
    </main>
  );
}
