'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronRight, FlaskConical, Gauge, HeartPulse, Info, OctagonAlert, Shield, Battery, Sprout, Target, Users, Wind, Wrench, Droplets, CalendarDays, AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { daysOf, scenarioOf, type MissionState } from '@/lib/sim';
import { cn } from '@/lib/utils';

/** "Your goal" bar shown above every mission screen. */
export function GoalBar({ m, onHelp }: { m: MissionState; onHelp: () => void }) {
  const N = daysOf(m), K = scenarioOf(m).objectivesRequired, done = m.objectives.filter(o => o.done).length, left = Math.max(0, N - m.day);
  const crew = m.health >= 70 ? ['Crew healthy', 'text-success border-success/50'] : m.health >= 40 ? ['Crew needs care', 'text-warning border-warning/50'] : ['Crew in danger', 'text-critical border-critical/50'];
  return (
    <section aria-label="Mission goal" className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-line-soft bg-gradient-to-r from-[#0B1626] to-[#080D17] px-4 py-2.5">
      <span className="label flex items-center gap-2 text-cyan"><Target className="size-[15px]" />Your goal</span>
      <span className="min-w-0 flex-[1_1_320px] text-sm leading-snug text-[#E3E9F2]">
        Keep all 4 astronauts safe until Day {N} and finish {K} science job{K > 1 ? 's' : ''}. Each press of Next Day moves the mission forward one day.
      </span>
      <div className="flex flex-wrap gap-2">
        <span className="flex h-[30px] items-center gap-2 rounded-full border border-line px-3 text-[12.5px]">
          <span className="text-ink-muted">Day</span><b className="tnum">{m.day} / {N}</b>
          <span className="h-1 w-[60px] overflow-hidden rounded-full bg-[#172235]"><span className="block h-full bg-cyan" style={{ width: `${(m.day / N) * 100}%` }} /></span>
          <span className="tnum text-ink-muted">{left ? `${left} to go` : 'last day'}</span>
        </span>
        <span className={cn('flex h-[30px] items-center gap-2 rounded-full border px-3 text-[12.5px]', done >= K ? 'border-success/50 text-success' : 'border-line')}><FlaskConical className="size-3.5" /><b className="tnum">{done} / {K}</b> science jobs</span>
        <span className={cn('flex h-[30px] items-center gap-2 rounded-full border px-3 text-[12.5px]', crew[1])}><Users className="size-3.5" />{crew[0]}</span>
        <Button size="sm" variant="outline" onClick={onHelp} className="h-[30px] gap-1.5 border-cyan text-cyan"><BookOpen className="size-3.5" />How to play</Button>
      </div>
    </section>
  );
}

type Chip = [string, LucideIcon, string];
const STEPS = (N: number, K: number): { icon: LucideIcon; color: string; title: string; body: string; chips: Chip[]; tip: string }[] => [
  { icon: Users, color: 'text-cyan', title: 'You are the Mission Commander', body: `Four astronauts live in your Moon base for ${N} days. Your job is to keep them safe and finish ${K} science job${K > 1 ? 's' : ''}.`,
    chips: [['Mehedi Hasan · Commander (you)', Award, 'border-cyan'], ['Maimuna Rahman · Engineer', Wrench, 'border-[#739CFF]'], ['Nahid Hasan · Scientist', FlaskConical, 'border-success'], ['Joy Barua · Doctor', HeartPulse, 'border-[#FF8A94]']], tip: 'The goal is always shown in the blue bar at the top of the screen.' },
  { icon: Gauge, color: 'text-success', title: 'Check the gauges', body: 'Air, water, food and power go down a little every day. Each gauge shows how much is left, the maximum it can hold, and how many days it will last.',
    chips: [['Green = OK', CheckCircle2, 'border-success'], ['Amber = be careful', AlertTriangle, 'border-warning'], ['Red = danger', OctagonAlert, 'border-critical']], tip: 'If a gauge turns red, fix it before you move to the next day.' },
  { icon: ChevronRight, color: 'text-cyan', title: 'One press = one day', body: 'Press Advance at the bottom. The base uses one day of air, water, food and power. Then the What Changed box tells you what happened and why.',
    chips: [['1. Check gauges', Gauge, 'border-cyan'], ['2. Fix problems', Wrench, 'border-warning'], ['3. Next day', ChevronRight, 'border-success']], tip: 'Nothing happens until you press the button. Take your time.' },
  { icon: Battery, color: 'text-warning', title: 'Save power with the switches', body: 'Machines need power from the battery. Turn one off to save power, but every switch has a cost.',
    chips: [['Make air', Wind, 'border-[#A9E8F5]'], ['Clean water', Droplets, 'border-[#739CFF]'], ['Grow lights', Sprout, 'border-success'], ['Do science', FlaskConical, 'border-cyan']], tip: 'When the Sun is hidden, the battery runs low. That is the best time to switch things off.' },
  { icon: AlertTriangle, color: 'text-critical', title: 'Emergencies are random', body: 'Solar storms and broken machines can happen on any day, and they pause the clock. Read each choice, ask Mission Control if you are unsure, then confirm.',
    chips: [['Shelter the crew', Shield, 'border-success'], ['Use the battery', Battery, 'border-warning'], ['Keep working outside', AlertTriangle, 'border-critical']], tip: 'Storms are forecast 2–3 days ahead — but some warnings never arrive.' },
  { icon: Award, color: 'text-success', title: 'How to win', body: `Reach Day ${N} with your crew safe and finish ${K} science job${K > 1 ? 's' : ''}. Then read your mission report to see what went well and what to try next time.`,
    chips: [['Crew safe', HeartPulse, 'border-success'], [`Reach Day ${N}`, CalendarDays, 'border-cyan'], [`${K} science job${K > 1 ? 's' : ''}`, FlaskConical, 'border-[#739CFF]']], tip: 'Every mission is different, so you can play again with a new strategy.' },
];

/** First-run 6-step guide. Opens automatically once; reopen from the goal bar. */
export function HowToPlay({ m, open, onClose }: { m: MissionState; open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  const all = STEPS(daysOf(m), scenarioOf(m).objectivesRequired), S = all[i], Icon = S.icon;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(3,6,12,.82)] p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="htp-t" className="max-h-[calc(100vh-32px)] w-[min(620px,100%)] overflow-y-auto rounded-[18px] border border-[#2E4560] bg-[#0B111D] shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-3.5">
          <span className="label text-cyan">How to play · {i + 1} of 6</span><div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={onClose}>Skip</Button>
        </div>
        <div className="flex flex-col gap-4 px-7 pb-2 pt-7">
          <span className={cn('grid size-16 place-items-center rounded-[18px] border border-current/40 bg-current/10', S.color)}><Icon className="size-[30px]" /></span>
          <h2 id="htp-t" className="text-[30px] font-semibold leading-tight tracking-[-.02em]">{S.title}</h2>
          <p className="text-[17px] leading-relaxed text-[#DCE4EF]">{S.body}</p>
          <div className="flex flex-wrap gap-2 rounded-xl border border-line-faint bg-[#060A13] p-3.5">
            {S.chips.map(([label, CI, b]) => <span key={label} className={cn('flex min-h-[38px] items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 text-sm font-semibold', b)}><CI className="size-4" />{label}</span>)}
          </div>
          <p className="flex gap-2 text-sm leading-snug text-[#FFE1A8]"><Info className="size-4 shrink-0" />{S.tip}</p>
        </div>
        <div className="flex items-center gap-3 px-7 pb-6 pt-4">
          <div aria-hidden className="flex flex-1 gap-1.5">{all.map((_, k) => <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-[22px]' : 'w-1.5', k <= i ? 'bg-cyan' : 'bg-line')} />)}</div>
          <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
          <Button onClick={() => (i >= 5 ? onClose() : setI(i + 1))}>{i === 5 ? 'Start the mission' : 'Next'}<ArrowRight /></Button>
        </div>
      </div>
    </div>
  );
}
