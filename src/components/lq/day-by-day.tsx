'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, ArrowRight, Battery, FlaskConical, Gauge, HeartPulse, Moon, Pause, Play, Sun, Target, Wind, AlertTriangle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CAPS, EVENTS, PRESETS, advanceDay, batteryCap, eventView, newMission, resolveEvent, sunOf, type MissionState } from '@/lib/sim';
import { cn } from '@/lib/utils';

type Snap = { o2: number; o2p: number; bat: number; batp: number; h: number; sci: number };
type Frame =
  | { kind: 'day'; day: number; sun: number; b: Snap; a: Snap; why: string[]; next: string | null; harvest: boolean; shed: boolean }
  | { kind: 'event'; day: number; sun: number; b: Snap; a: Snap; title: string; choice: string; text: string; why: string };

/** Plays one real engine mission (seed 7) day by day: check → decide → what happened. */
function buildStory(): Frame[] {
  let s: MissionState = newMission(PRESETS.balanced, { scenario: 'outpost', seed: 7 });
  const snap = (x: MissionState): Snap => ({ o2: x.o2, o2p: x.o2 / CAPS.o2, bat: x.battery, batp: x.battery / batteryCap(x), h: x.health, sci: x.objectives.filter(o => o.done).length });
  const F: Frame[] = [];
  for (let g = 0; s.status === 'active' && g < 80; g++) {
    const v = eventView(s);
    if (v) {
      const pick = v.choices.find(c => c.id === 'repair' && !c.disabled) ?? v.choices.find(c => c.id === 'shelter') ?? v.choices[0];
      const b = snap(s); s = resolveEvent(s, pick.id);
      F.push({ kind: 'event', day: s.day, sun: sunOf(s)[s.day - 1] ?? 1, b, a: snap(s), title: v.title, choice: pick.label, text: s.lastOutcome?.text ?? '', why: s.lastOutcome?.why ?? '' });
      continue;
    }
    const b = snap(s), d = s.day; s = advanceDay(s); const why = s.lastDay?.why ?? [];
    F.push({ kind: 'day', day: d, sun: sunOf(s)[d - 1] ?? 1, b, a: snap(s), why, next: s.pendingEvent ? EVENTS[s.pendingEvent].title : null, harvest: why.some(w => /harvest/.test(w)), shed: why.some(w => /cut/.test(w)) });
  }
  return F;
}

export function DayByDay() {
  const F = useMemo(buildStory, []);
  const [f, setF] = useState(0), [ph, setPh] = useState(0), [play, setPlay] = useState(true);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => { if (document.hidden) return; setPh(p => { if (p < 2) return p + 1; setF(x => (x + 1) % F.length); return 0; }); }, 1500);
    return () => clearInterval(t);
  }, [play, F.length]);
  const fr = F[f], after = ph >= 2, v = after ? fr.a : fr.b, ev = fr.kind === 'event', dark = fr.sun < .5;
  const tone = (p: number) => (p < .1 ? ['#FF6B78', 'Danger'] : p < .25 ? ['#FFC66D', 'Careful'] : ['#57D9A3', 'Good']);
  const dl = (x: number, y: number, u: string, dec = false) => { const k = dec ? 10 : 1, d = Math.round((y - x) * k) / k; return { t: `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} ${u}`, c: d > 0 ? 'text-success' : d < 0 ? 'text-[#FF8A94]' : 'text-ink-muted' }; };
  const gauges = [
    { name: 'Air', Icon: Wind, p: v.o2p, val: `${Math.round(v.o2)} kg`, d: dl(fr.b.o2, fr.a.o2, 'kg', true) },
    { name: 'Power', Icon: Battery, p: v.batp, val: `${Math.round(v.bat)} kWh`, d: dl(fr.b.bat, fr.a.bat, 'kWh') },
    { name: 'Crew', Icon: HeartPulse, p: v.h / 100, val: `${Math.round(v.h)} / 100`, d: dl(fr.b.h, fr.a.h, '') },
  ];
  const steps = [
    ['Check the gauges', ev ? 'Something is wrong — look at what is at risk.' : 'Air, power and crew: green is good, red is danger.'],
    [ev ? 'Respond to the emergency' : 'Make a decision', ev ? fr.choice : dark ? 'Little sunlight today — keep life support running.' : 'Keep everything running and do science.'],
    [ev ? 'See the result' : 'Press Next Day', ev ? 'The game calculates what your choice cost.' : 'The base uses one day of supplies. See what changed.'],
  ];
  const batDelta = fr.a.bat - fr.b.bat;
  const cap = ph === 0
    ? { label: 'Step 1 · Check', Icon: Gauge, color: 'text-cyan border-cyan/40 bg-cyan/5', title: ev ? `Emergency: ${fr.title}` : `Morning of day ${fr.day}`, text: ev ? 'The clock stops. The commander reads what is happening before choosing.' : dark ? 'The Sun is hidden behind the hills, so the solar panels will make less power today.' : 'The commander checks air, power and crew health before deciding anything.', lesson: '' }
    : ph === 1
    ? { label: 'Step 2 · Decide', Icon: Target, color: 'text-warning border-warning/40 bg-warning/5', title: ev ? `Choice: ${fr.choice}` : 'Plan: a normal work day', text: ev ? 'Every choice has a cost. Safer choices protect the crew but can slow down science or use power.' : 'The crew runs science today. That uses a little extra power.', lesson: '' }
    : { label: 'Step 3 · What happened', Icon: Activity, color: 'text-success border-success/40 bg-success/5', title: ev ? 'Result of the decision' : `End of day ${fr.day}`,
        text: ev ? fr.text : (fr.why[0] ?? `A normal day. The base used air, water, food and power${batDelta > 1 ? ', and the solar panels charged the battery.' : batDelta < -1 ? ', and used more power than the panels made, so the battery went down.' : ', and the battery stayed about the same.'}`) + (fr.next ? ` Tomorrow: ${fr.next.toLowerCase()}!` : ''),
        lesson: ev ? (fr.why ? `Why: ${fr.why}` : '') : fr.shed ? 'Lesson: an empty battery switches machines off' : dark ? 'Lesson: no sunlight means less solar power' : fr.harvest ? 'Lesson: plants take time before you can eat them' : fr.a.sci > fr.b.sci ? 'Science job finished!' : '' };
  const go = (d: number) => { setF(x => ((x + d) % F.length + F.length) % F.length); setPh(2); setPlay(false); };
  const SkyIcon = ev ? AlertTriangle : dark ? Moon : Sun;

  return (
    <section id="daybyday" aria-labelledby="dbd-h" className="border-t border-[#121B2A]">
      <div className="mx-auto px-5 py-[clamp(80px,10vw,130px)] md:px-14">
        <div className="mb-9 grid items-end gap-x-16 gap-y-6 lg:grid-cols-2">
          <div><div className="label mb-4 text-cyan">02 — Watch a mission, day by day</div>
            <h2 id="dbd-h" className="text-balance text-[clamp(32px,4vw,54px)] font-semibold leading-[1.02] tracking-[-.03em]">Every day is the same three steps.</h2></div>
          <p className="max-w-[480px] leading-relaxed text-ink-muted">This is a real 30-day mission played by the game engine. Watch what the commander checks, what they decide, and what changes — then explore any day yourself.</p>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-line-soft bg-well">
          <div className="flex flex-wrap">
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 border-r border-line-soft bg-gradient-to-b from-[#0D1626] to-well p-[clamp(20px,3vw,32px)]">
              <div className="flex items-center gap-4">
                <span className={cn('grid size-16 shrink-0 place-items-center rounded-[18px] transition-colors', ev ? 'bg-critical/15 text-[#FF8A94]' : dark ? 'bg-ink-muted/10 text-ink-2' : 'bg-warning/15 text-warning')}><SkyIcon className="size-8" /></span>
                <div><div className="label mb-2 text-ink-muted">Mission day</div><div aria-live="polite" className="tnum text-[56px] font-bold leading-[.9] tracking-[-.03em]">{String(fr.day).padStart(2, '0')}<span className="text-xl font-normal text-ink-faint"> / 30</span></div></div>
              </div>
              <ol aria-label="Today's steps" className="flex flex-col gap-2.5">
                {steps.map(([t, sub], k) => (
                  <li key={k} className={cn('flex items-center gap-3.5 rounded-[14px] border-[1.5px] px-3.5 py-3 transition-colors', k === ph ? 'border-cyan bg-cyan/[.08]' : 'border-line-soft')}>
                    <span className={cn('grid size-[34px] shrink-0 place-items-center rounded-full font-bold transition-colors', k === ph ? 'bg-cyan text-[#04111A]' : k < ph ? 'bg-[#1F3B55] text-cyan' : 'bg-elevated text-ink-faint')}>{k + 1}</span>
                    <span className="min-w-0"><span className={cn('block font-semibold', k === ph ? 'text-ink' : 'text-ink-muted')}>{t}</span><span className="block text-[13.5px] leading-snug text-ink-muted">{sub}</span></span>
                  </li>))}
              </ol>
            </div>
            <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-5 p-[clamp(20px,3vw,32px)]">
              <ul aria-label="Gauges" className="grid gap-3 sm:grid-cols-3">
                {gauges.map(({ name, Icon, p, val, d }) => { const [c, w] = tone(p); return (
                  <li key={name} className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] bg-surface p-4 transition-[border-color,box-shadow]" style={{ borderColor: ph === 0 ? c + '99' : '#1B273A', boxShadow: ph === 0 ? `0 0 0 4px ${c}1A` : 'none' }}>
                    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-semibold"><Icon className="size-[18px]" style={{ color: c }} />{name}</span><span className="text-[13px] font-bold" style={{ color: c }}>{w}</span></div>
                    <div className="h-3.5 overflow-hidden rounded-full bg-[#172235]"><div className="h-full rounded-full transition-[width,background-color] [transition-duration:900ms] ease-out" style={{ width: `${Math.max(0, Math.min(100, p * 100))}%`, background: c }} /></div>
                    <div className="flex items-baseline justify-between gap-2"><span className="tnum whitespace-nowrap text-[22px] font-bold">{val}</span><span className={cn('whitespace-nowrap text-sm font-semibold transition-opacity', d.c, after ? 'opacity-100' : 'opacity-0')}>{d.t}</span></div>
                  </li>); })}
              </ul>
              <div aria-live="polite" className={cn('flex min-h-[170px] flex-1 flex-col gap-2.5 rounded-2xl border-[1.5px] px-5 py-4 transition-colors', cap.color)}>
                <div className="label flex items-center gap-2.5"><cap.Icon className="size-[15px]" />{cap.label}</div>
                <div className="text-xl font-semibold leading-snug text-ink">{cap.title}</div>
                <p className="leading-relaxed text-[#DCE4EF]">{cap.text}</p>
                {cap.lesson && <span className="mt-auto flex items-center gap-2 self-start rounded-[10px] bg-cyan/10 px-3 py-2 text-sm font-semibold text-cyan"><FlaskConical className="size-[15px]" />{cap.lesson}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line-soft bg-[#080D17] px-[clamp(16px,3vw,28px)] py-4">
            <div className="flex gap-1.5">
              <button onClick={() => go(-1)} aria-label="Previous day" className="grid size-[42px] place-items-center rounded-[10px] border border-[#2E3F58] hover:border-cyan"><ArrowLeft className="size-4" /></button>
              <button onClick={() => { setPlay(p => !p); if (!play) setPh(0); }} aria-label={play ? 'Pause walkthrough' : 'Play walkthrough'} className="flex h-[42px] items-center gap-2 rounded-[10px] bg-cyan px-4 font-semibold text-[#04111A]">{play ? <Pause className="size-4" /> : <Play className="size-4" />}{play ? 'Pause' : 'Play'}</button>
              <button onClick={() => go(1)} aria-label="Next day" className="grid size-[42px] place-items-center rounded-[10px] border border-[#2E3F58] hover:border-cyan"><ArrowRight className="size-4" /></button>
            </div>
            <div role="group" aria-label="Jump to a day" className="grid min-w-0 flex-[1_1_420px] gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.min(F.length, 18)}, minmax(0,1fr))` }}>
              {F.map((x, k) => { const cur = k === f, e = x.kind === 'event'; return (
                <button key={k} onClick={() => { setF(k); setPh(2); setPlay(false); }} aria-current={cur} title={e ? `Day ${x.day}: ${(x as any).title}` : `Day ${x.day}`}
                  className={cn('h-[30px] min-w-0 rounded-md font-mono text-[10px] transition-colors', cur ? 'bg-cyan text-[#04111A]' : e ? 'bg-critical/45' : x.sun < .5 ? 'bg-warning/35' : 'bg-[#16243A]')}>{e ? '!' : x.day}</button>); })}
            </div>
          </div>
        </div>
        <div className="mt-7 flex justify-center"><Link href="/missions" className={cn(buttonVariants({ size: 'lg' }), 'tracking-[.05em]')}>NOW TRY IT YOURSELF <ArrowRight /></Link></div>
      </div>
    </section>
  );
}
