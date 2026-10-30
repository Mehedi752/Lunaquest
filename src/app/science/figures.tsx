'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Droplets, HeartPulse, Sprout, Wind, Zap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EQUIPMENT, P, SUN } from '@/lib/sim';
import { cn } from '@/lib/utils';
import type { Module } from './modules';
import { SEGMENT_COLORS } from '@/lib/sim/colors';

function Life() {
  const Box = ({ t, s, hi }: { t: string; s: string; hi?: boolean }) => (
    <span className={cn('rounded-[10px] border px-4 py-3.5 text-center', hi ? 'border-cyan bg-cyan/[.08]' : 'border-[#2E4560] bg-[#0D1726]')}>
      <span className="block font-semibold">{t}</span><span className="text-xs text-ink-muted">{s}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Box t="Water" s="1.125 kg" />
      <span className="flex flex-col items-center gap-0.5 text-[11px] text-cyan"><Zap className="size-4" />electrolysis</span>
      <Box t="Oxygen" s="1 kg → crew" hi /><span className="text-ink-faint">+</span><Box t="Hydrogen" s="0.125 kg" />
      <span className="mt-1.5 basis-full text-[13px] text-ink-muted">Four astronauts breathe about 3.4 kg of oxygen per day in the game — so better air always costs water and power.</span>
    </div>
  );
}

function Rad() {
  const [l, setL] = useState('1');
  const pf = P.shieldPF[Number(l)];
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup type="single" value={l} onValueChange={v => v && setL(v)} aria-label="Shielding level" className="self-start">
        {['None', 'Basic', 'Enhanced', 'Hardened'].map((t, i) => <ToggleGroupItem key={t} value={String(i)} className="h-8 px-3 text-[13px]">{t}</ToggleGroupItem>)}
      </ToggleGroup>
      <div className="grid grid-cols-[120px_1fr] items-center gap-x-3.5 gap-y-2.5 text-[13px]">
        <span className="text-ink-muted">Storm hazard</span><div className="h-3 rounded bg-critical" />
        <span className="text-ink-muted">Blocked by shelter</span><div className="h-3 rounded bg-line-faint"><div className="h-full rounded bg-blue transition-[width] duration-300" style={{ width: `${pf * 100}%` }} /></div>
        <span className="text-ink-muted">Reaches crew</span><div className="h-3 rounded bg-line-faint"><div className="h-full rounded bg-warning transition-[width] duration-300" style={{ width: `${(1 - pf) * 100}%` }} /></div>
      </div>
      <span aria-live="polite" className="text-[13px] text-ink-muted">In the game, this shelter blocks {Math.round(pf * 100)}% of a storm’s hazard. Sheltering the crew adds 30 points more, up to 95%.</span>
    </div>
  );
}

function Energy() {
  const [bat, setBat] = useState(1);
  const cap = P.batteryBase + P.batteryPerLevel * bat, load = 28, gen = P.solarPerLevel;
  let worst = 0, cur = 0;
  SUN.forEach(s => { const n = gen * s - load; cur = n < 0 ? cur - n : 0; worst = Math.max(worst, cur); });
  worst = Math.round(worst);
  const ok = cap >= worst;
  return (
    <div className="flex flex-col gap-3.5">
      <div role="img" aria-label="Illustrative sunlight profile across 30 mission days" className="flex h-[90px] items-end gap-[3px]">
        {SUN.map((s, i) => <span key={i} title={`Day ${i + 1}: ${Math.round(s * 100)}% sunlight`} className={cn('flex-1 rounded-t-sm', s < .5 ? 'bg-[#3A4E6B]' : 'bg-cyan')} style={{ height: `${s * 100}%` }} />)}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-ink-faint"><span>DAY 1</span><span>SHADOW PERIOD</span><span>DAY 30</span></div>
      <label id="bat-l" className="mt-1.5 flex justify-between text-[13px]"><span>Battery storage</span><span className="tnum">{cap} kWh</span></label>
      <Slider aria-labelledby="bat-l" min={0} max={3} step={1} value={[bat]} onValueChange={([v]) => setBat(v)} />
      <div aria-live="polite" className={cn('flex gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px] leading-normal', ok ? 'border-success/35' : 'border-critical/40')}>
        {ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <AlertTriangle className="size-4 shrink-0 text-critical" />}
        <span>{ok ? `With one solar array and a 28 kWh/day load, the deepest shortfall is about ${worst} kWh. A ${cap} kWh battery bridges it.`
          : `With one solar array and a 28 kWh/day load, the shadow period runs up a ${worst} kWh shortfall. A ${cap} kWh battery runs dry — the outpost starts shedding loads.`}</span>
      </div>
    </div>
  );
}

function Water() {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {[[0, 'No recycler'], [.75, 'Level 1'], [.88, 'Level 2'], [.95, 'Level 3']].map(([r, label]) => {
        const rate = r as number;
        return (
          <div key={label as string} className={cn('rounded-[10px] border bg-[#0D1726] p-3.5', rate >= .95 ? 'border-success/35' : 'border-[#2E4560]')}>
            <div className="mb-1.5 text-xs text-ink-muted">{label}</div>
            <div className="tnum text-[22px] font-semibold">{Math.round(rate * 100)}%</div>
            <div className={cn('mt-1 text-xs', rate < .5 ? 'text-critical-soft' : rate < .9 ? 'text-warning' : 'text-success')}>−{(12 * (1 - rate)).toFixed(1)} L/day lost</div>
          </div>
        );
      })}
    </div>
  );
}

function Food() {
  return (
    <div className="flex flex-col gap-2.5">
      <div role="img" aria-label="Greenhouse produces nothing until day 8" className="flex gap-[3px]">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={cn('grid h-7 flex-1 place-items-center rounded font-mono text-[9px]', i + 1 >= P.ghMature ? 'bg-success text-[#04140D]' : 'bg-[#1B2B42] text-ink-faint')}>{i + 1}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#1B2B42]" />Growing — costs power and water</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" />Harvesting</span>
      </div>
    </div>
  );
}

function Hab() {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {([[Wind, 'Oxygen', 'power + water'], [Droplets, 'Recycling', 'power'], [Sprout, 'Greenhouse', 'power + water + time'], [HeartPulse, 'Crew', 'oxygen + water + food']] as const).map(([I, k, n]) => (
        <div key={k} className="rounded-[10px] border border-[#2E4560] bg-[#0D1726] p-3.5">
          <div className="mb-1.5 flex items-center gap-2 font-semibold"><I className="size-[15px]" />{k}</div>
          <div className="text-[12.5px] leading-normal text-ink-muted">needs {n}</div>
        </div>
      ))}
    </div>
  );
}

function Trade() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded">
        {EQUIPMENT.filter(e => e.id !== 'reserves').map(e => <span key={e.id} title={`${e.name} L1: ${e.costs[0]} cr`} style={{ width: `${e.costs[0]}%`, background: SEGMENT_COLORS[e.id] }} />)}
        <span className="bg-line-faint" style={{ width: '5%' }} title="Emergency Reserves L1 (10 cr) — only 5 cr left" />
      </div>
      <div className="text-[13px] text-ink-muted">A level-1 version of all seven systems costs 105 credits. The budget is 100. Something has to give.</div>
    </div>
  );
}

export function ModuleFigure({ id }: { id: Module['id'] }) {
  const F = { life: Life, rad: Rad, energy: Energy, water: Water, food: Food, hab: Hab, trade: Trade }[id];
  return <F />;
}
