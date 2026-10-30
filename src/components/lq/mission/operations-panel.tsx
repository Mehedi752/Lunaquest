'use client';

import { Droplets, FlaskConical, Info, Rocket, Sprout, Wind, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/lib/store';
import { P, bonusInfo, powerOf, type MissionState, type PowerKey } from '@/lib/sim';
import { cn, pad2 } from '@/lib/utils';

const SWITCHES: { key: PowerKey; label: string; icon: LucideIcon; kwh: (m: MissionState) => number; built: (m: MissionState) => boolean }[] = [
  { key: 'oxygen', label: 'Make air', icon: Wind, kwh: m => P.o2Load * m.levels.oxygen, built: m => m.levels.oxygen > 0 },
  { key: 'recycler', label: 'Clean water', icon: Droplets, kwh: m => P.recLoad * m.levels.recycler, built: m => m.levels.recycler > 0 },
  { key: 'greenhouse', label: 'Grow lights', icon: Sprout, kwh: m => P.ghLoad * m.levels.greenhouse, built: m => m.levels.greenhouse > 0 },
  { key: 'research', label: 'Do science', icon: FlaskConical, kwh: () => (P as any).researchLoad ?? 6, built: () => true },
];

/** Daily operations: power switches, bonus experiment, and the engine's "what changed and why" report. */
export function OperationsPanel({ m, locked }: { m: MissionState; locked: boolean }) {
  const togglePower = useMissionStore(s => s.togglePower), bonus = useMissionStore(s => s.bonus);
  const pw = powerOf(m), bi = bonusInfo(m), LD = m.lastDay;
  const active = m.status === 'active' && !locked;
  const deltas = LD ? ([['O₂', LD.delta.o2, 'kg'], ['Water', LD.delta.water, 'L'], ['Food', LD.delta.food, 'kg'], ['Battery', LD.delta.battery, 'kWh']] as const) : [];
  const why = LD ? (LD.why.length ? LD.why : ['Everything ran normally. Production and use matched the rates shown above.']).slice(0, 3)
    : ['Press Next Day to move one day. You will see what changed and why.'];
  return (
    <section aria-label="Daily operations" className="flex flex-wrap gap-3 rounded-xl border border-line-soft bg-[#080D17] p-3">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="label">Power switches</span>
          <span className="text-xs text-ink-faint">Turn things off to save battery. Some choices have costs.</span>
        </div>
        <div role="group" aria-label="Power switches" className="flex flex-wrap gap-1.5">
          {SWITCHES.map(({ key, label, icon: Icon, kwh, built }) => {
            const inst = built(m), on = inst && pw[key], dis = !inst || !active;
            return (
              <button key={key} role="switch" aria-checked={on} disabled={dis} onClick={() => togglePower(key, !pw[key])}
                title={inst ? `${label} uses ${kwh(m)} kWh per day` : 'Not installed'}
                className={cn('flex min-h-10 items-center gap-2 rounded-[9px] border px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed',
                  on ? 'border-[#2F5A73] bg-[#0F1C2B] text-ink' : 'border-line bg-transparent', inst ? 'text-ink' : 'text-ink-faint opacity-55')}>
                <span aria-hidden className={cn('relative h-4 w-7 shrink-0 rounded-full transition-colors', on ? 'bg-cyan' : 'bg-[#2E3F58]')}>
                  <span className={cn('absolute top-0.5 size-3 rounded-full bg-ink transition-[left]', on ? 'left-3.5' : 'left-0.5')} />
                </span>
                <Icon className="size-3.5" />{label}<span className="font-mono text-[11px] text-ink-muted">{inst ? `${kwh(m)} kWh` : 'not built'}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button variant="secondary" disabled={!bi.available || !active} onClick={bonus} className="h-10 gap-2">
            <Rocket className="size-4" />Bonus spacewalk experiment<span className="font-mono text-[11px] text-warning">−{bi.o2} kg O₂</span>
          </Button>
          <span className="flex-[1_1_220px] text-[12.5px] leading-snug text-ink-muted">
            {bi.available ? `Pushes “${bi.job}” forward one extra day, but refilling spacesuits uses ${bi.o2} kg of oxygen.` : bi.reason}
          </span>
        </div>
      </div>
      <div aria-live="polite" className="min-w-0 flex-[1_1_380px] rounded-[10px] border border-line-soft bg-well px-3.5 py-2.5">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="label text-cyan">{LD ? `Day ${pad2(LD.day)} · What changed` : 'What changed'}</span>
          {deltas.map(([n, v, u]) => (
            <span key={n} className={cn('font-mono text-xs', v > .05 ? 'text-success' : v < -.05 ? 'text-[#FF8A94]' : 'text-ink-muted')}>
              {n} {v > 0 ? '+' : v < 0 ? '−' : '±'}{Math.abs(v)} {u}
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-1">
          {why.map(t => <li key={t} className="flex gap-2 text-[13px] leading-snug text-ink-2"><Info className="mt-0.5 size-3.5 shrink-0 text-cyan" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}
