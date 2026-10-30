'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, FlaskConical, Minus, OctagonAlert, Shield, Sun, Target, Wrench } from 'lucide-react';
import { SimIcon } from '@/components/lq/icons';
import { STATUS } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import {
  CAPS, EQUIPMENT, OBJECTIVES, P, advanceDay, daysOf, forecast, nextCost, scenarioOf, sunOf,
  type Alert, type EquipmentId, type IconName, type MissionState, type ResourceView, type Snapshot, type Status,
} from '@/lib/sim';
import { cn, f0, f1, pad2, signed } from '@/lib/utils';

export type ModuleId = EquipmentId | 'hab';
const HEX: Record<Status, string> = { stable: '#57D9A3', warning: '#FFC66D', critical: '#FF6B78' };
const daysLeft = (d: number) => (isFinite(d) ? `${Math.max(0, Math.floor(d))} d left` : 'Not declining');

/* ------------------------------------------------------------ resource strip */
export function ResourceStrip({ m, R, selected, onSelect }: { m: MissionState; R: ResourceView; selected: ModuleId; onSelect: (id: ModuleId) => void }) {
  const H = m.history.slice(-12);
  const spark = (get: (h: Snapshot) => number) => {
    if (H.length < 2) return 'M0,13 L84,13';
    return H.map((h, i) => `${i ? 'L' : 'M'}${((i / (H.length - 1)) * 84).toFixed(1)},${(24 - Math.max(0, Math.min(1, get(h))) * 22).toFixed(1)}`).join(' ');
  };
  const items: { key: string; mod: ModuleId; label: string; icon: IconName; value: string; unit: string; pct: number; status: Status; flow: string; eta: string; spark: string }[] = [
    { key: 'o2', mod: 'oxygen', label: 'Oxygen', icon: 'wind', value: f1(R.o2.value), unit: `/ ${CAPS.o2} kg max`, pct: R.o2.value / R.o2.cap, status: R.o2.status, flow: `${signed(R.o2.net)} kg/day`, eta: R.o2.net < 0 ? daysLeft(R.o2.days) : 'Rising', spark: spark(h => h.o2 / CAPS.o2) },
    { key: 'water', mod: 'recycler', label: 'Water', icon: 'droplets', value: f0(R.water.value), unit: `/ ${CAPS.water} L max`, pct: R.water.value / R.water.cap, status: R.water.status, flow: `${signed(R.water.net)} L/day`, eta: R.water.net < 0 ? daysLeft(R.water.days) : 'Rising', spark: spark(h => h.water / CAPS.water) },
    { key: 'power', mod: 'battery', label: 'Energy', icon: 'battery', value: f0(R.power.value), unit: `/ ${R.power.cap} kWh max`, pct: R.power.value / R.power.cap, status: R.power.status, flow: `${f0(R.power.gen)} in · ${f0(R.power.load)} out`, eta: R.power.net < 0 ? daysLeft(R.power.days) : 'Charging', spark: spark(h => h.battery / h.batteryCap) },
    { key: 'food', mod: 'greenhouse', label: 'Food', icon: 'sprout', value: f0(R.food.value), unit: `/ ${CAPS.food} kg max`, pct: R.food.value / R.food.cap, status: R.food.status, flow: `${signed(R.food.net)} kg/day`, eta: R.food.net < 0 ? daysLeft(R.food.days) : 'Rising', spark: spark(h => h.food / CAPS.food) },
    { key: 'crew', mod: 'hab', label: 'Crew', icon: 'heart', value: f0(m.health), unit: '/ 100 health', pct: m.health / 100, status: R.crew.status, flow: `Exposure: ${R.crew.exposure.toLowerCase()}`, eta: '4 / 4 aboard', spark: spark(h => h.health / 100) },
  ];
  return (
    <section aria-label="Resources" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-px border-b border-line-soft bg-line-soft">
      {items.map(r => {
        const S = STATUS[r.status], on = selected === r.mod, c = HEX[r.status];
        return (
          <button key={r.key} onClick={() => onSelect(r.mod)} aria-label={`${r.label}: ${r.value} ${r.unit}, ${S.label}`}
            className={cn('flex min-w-0 flex-col gap-[7px] px-4 py-3 text-left transition-colors hover:bg-[#101A2B]', on ? 'bg-[#0F1A2A] shadow-[inset_0_-2px_0_#5DE1FF]' : 'bg-well')}>
            <span className="flex w-full items-center gap-[7px]">
              <SimIcon name={r.icon} className="size-3.5 text-ink-muted" />
              <span className="label flex-1 text-[10.5px] text-ink-2">{r.label}</span>
              <span className={cn('flex items-center gap-1 text-[11px] font-medium', S.text)}><S.icon className="size-3" />{S.label}</span>
            </span>
            <span className="flex w-full items-end justify-between gap-2.5">
              <span className="flex min-w-0 items-baseline gap-[5px]">
                <span className="tnum text-[22px] font-semibold tracking-[-.02em]">{r.value}</span>
                <span className="tnum whitespace-nowrap text-xs text-ink-muted">{r.unit}</span>
              </span>
              <svg aria-hidden width="84" height="26" viewBox="0 0 84 26" className="shrink-0 overflow-visible"><path d={r.spark} fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity=".9" /></svg>
            </span>
            <span className="relative block h-[3px] w-full rounded-sm bg-[#172235]"><span className="absolute inset-y-0 left-0 rounded-sm transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, r.pct * 100))}%`, background: c }} /></span>
            <span className="tnum flex w-full justify-between gap-2 text-[11.5px]"><span className="text-ink-muted">{r.flow}</span><span className="whitespace-nowrap" style={{ color: r.eta.includes('d left') && r.status !== 'stable' ? c : '#91A0B7' }}>{r.eta}</span></span>
          </button>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------ module model */
interface Mod { id: ModuleId; label: string; icon: IconName; x: number; y: number; w: number; h: number; round?: boolean; status: Status; sub: string; installed: boolean; offline: boolean }
function useModules(m: MissionState, R: ResourceView): Mod[] {
  const L = m.levels, md = m.mods, ghDead = (md.ghDeadUntil ?? 0) >= m.day;
  const inst = (id: ModuleId) => id === 'hab' || id === 'battery' || L[id] > 0;
  const raw: Omit<Mod, 'installed' | 'offline'>[] = [
    { id: 'solar', label: 'Solar arrays', icon: 'sun', x: 18, y: 26, w: 150, h: 84, status: R.power.sun < .5 ? 'warning' : 'stable', sub: `${f0(R.power.gen)} kWh/d` },
    { id: 'battery', label: 'Battery bank', icon: 'battery', x: 14, y: 54, w: 124, h: 80, status: R.power.status, sub: `${f0(R.power.value)} kWh` },
    { id: 'oxygen', label: 'O₂ generator', icon: 'wind', x: 28, y: 74, w: 132, h: 74, status: R.o2.status, sub: `${f1(R.o2.production)} kg/d` },
    { id: 'hab', label: 'Habitat core', icon: 'home', x: 50, y: 48, w: 140, h: 140, round: true, status: R.crew.status, sub: '4 crew' },
    { id: 'shielding', label: 'Storm shelter', icon: 'shield', x: 78, y: 26, w: 132, h: 80, status: R.radiation.status, sub: `Level ${L.shielding}` },
    { id: 'greenhouse', label: 'Greenhouse', icon: 'sprout', x: 85, y: 50, w: 128, h: 84, status: ghDead ? 'critical' : R.food.status, sub: R.food.production ? `${f1(R.food.production)} kg/d` : 'Growing' },
    { id: 'recycler', label: 'Water recycler', icon: 'droplets', x: 72, y: 74, w: 136, h: 74, status: R.water.recOn ? R.water.status : 'critical', sub: R.water.recOn ? `${Math.round(R.water.recycling * 100)}%` : 'Offline' },
  ];
  return raw.map(d => ({ ...d, installed: inst(d.id), offline: (d.id === 'recycler' && !R.water.recOn) || (d.id === 'greenhouse' && ghDead) }));
}

/* ------------------------------------------------------------ systems list */
export function SystemsList({ m, R, selected, onSelect }: { m: MissionState; R: ResourceView; selected: ModuleId; onSelect: (id: ModuleId) => void }) {
  const mods = useModules(m, R);
  const K = scenarioOf(m).objectivesRequired, done = m.objectives.filter(o => o.done).length, active = m.objectives.findIndex(o => !o.done);
  return (
    <aside aria-labelledby="sys-h" className="flex min-w-0 flex-col gap-3">
      <section className="rounded-xl border border-line-soft bg-surface">
        <h2 id="sys-h" className="label border-b border-line-soft px-3.5 py-3 text-ink-2">System status</h2>
        <ul className="flex flex-col gap-0.5 p-1.5">
          {mods.map(d => { const S = STATUS[d.status], on = selected === d.id; return (
            <li key={d.id}>
              <button onClick={() => onSelect(d.id)} aria-pressed={on} className={cn('grid w-full grid-cols-[20px_1fr_auto] items-center gap-2.5 rounded-lg border px-2.5 py-[9px] text-left hover:bg-elevated', on ? 'border-cyan/50 bg-[#0F1C2B]' : 'border-transparent')}>
                <SimIcon name={d.icon} className={cn('size-4', d.installed ? S.text : 'text-ink-faint')} />
                <span className="min-w-0"><span className="block text-[13px] font-medium">{d.label}</span><span className="tnum block text-[11.5px] text-ink-muted">{d.installed ? d.sub : 'Not installed'}</span></span>
                <span className={cn('flex items-center gap-[5px] whitespace-nowrap text-[11px] font-medium', d.installed ? (d.offline ? 'text-critical' : S.text) : 'text-ink-faint')}>
                  {d.installed ? (d.offline ? <><OctagonAlert className="size-3" />Offline</> : <><S.icon className="size-3" />{d.status === 'stable' ? 'Operational' : d.status === 'warning' ? 'Under strain' : 'Critical'}</>) : <><Minus className="size-3" />None</>}
                </span>
              </button>
            </li>); })}
        </ul>
      </section>
      <section aria-labelledby="obj-h" className="rounded-xl border border-line-soft bg-surface">
        <div className="flex items-center gap-2 border-b border-line-soft px-3.5 py-3"><h2 id="obj-h" className="label flex-1 text-ink-2">Objectives</h2><span className="tnum text-[11.5px] text-ink-muted">{done} / 5 · {K} required</span></div>
        <ul className="flex flex-col gap-[9px] px-3.5 py-3">
          {m.objectives.map((o, i) => { const def = OBJECTIVES[i], on = i === active, Icon = o.done ? CheckCircle2 : on ? Target : Minus, c = o.done ? 'bg-success' : on ? 'bg-cyan' : 'bg-[#3A4E6B]'; return (
            <li key={o.id} className="text-[12.5px]">
              <div className="mb-[5px] flex items-center gap-2"><Icon className={cn('size-[13px]', o.done ? 'text-success' : on ? 'text-cyan' : 'text-[#3A4E6B]')} /><span className={cn('flex-1', o.done || on ? 'text-ink' : 'text-ink-muted')}>{def.name}</span><span className="tnum text-ink-faint">{o.done ? 'Done' : `${o.progress}/${def.days} d`}</span></div>
              <div className="ml-[21px] h-[3px] rounded-sm bg-[#172235]"><div className={cn('h-full rounded-sm transition-[width] duration-500', c)} style={{ width: `${Math.min(100, (o.progress / def.days) * 100)}%` }} /></div>
            </li>); })}
        </ul>
        <div className="flex justify-between border-t border-line-soft px-3.5 py-2.5 text-[12.5px]"><span className="text-ink-muted">Credits available</span><span className="tnum font-semibold">{m.credits} cr</span></div>
      </section>
    </aside>
  );
}

/* ------------------------------------------------------------ outpost scene */
export function OutpostScene({ m, R, selected, onSelect, onAdvance, canAdvance, advanceText }: {
  m: MissionState; R: ResourceView; selected: ModuleId; onSelect: (id: ModuleId) => void; onAdvance: () => void; canAdvance: boolean; advanceText: string;
}) {
  const mods = useModules(m, R), hab = mods.find(d => d.id === 'hab')!;
  const sun = R.power.sun, dark = sun < .5, storm = m.pendingEvent === 'storm';
  const fc = forecast(m).filter(f => f.kind === 'storm');
  const wx = storm ? ['Storm in progress', '#FF6B78'] : fc.length ? [`Storm watch · day ${fc[0].day}`, '#FFC66D'] : ['Quiet', '#57D9A3'];
  const nextSun = sunOf(m)[m.day] ?? 1, N = daysOf(m);
  const tomorrow = m.status !== 'active' ? 'The mission has ended.' : m.pendingEvent ? 'Resolve the emergency before time can move on.'
    : m.day >= N ? 'Final day — finish strong.' : nextSun < .5 ? `Day ${m.day + 1}: sunlight drops to ${Math.round(nextSun * 100)}%. Arrays will make less power.` : `Day ${m.day + 1}: sunlight ${Math.round(nextSun * 100)}%. Battery ${R.power.net >= 0 ? 'should charge' : 'will keep falling'} at today’s rates.`;
  return (
    <section aria-labelledby="scene-h" className="relative min-h-[520px] overflow-hidden rounded-[14px] border border-line-soft bg-[#06090F]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://www.nasa.gov/wp-content/uploads/2026/05/moon-background.png?w=1600" alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-[.32] [filter:grayscale(.4)_contrast(1.1)]" />
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(93,225,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(93,225,255,.05)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_52%,rgba(7,11,20,0)_0%,rgba(7,11,20,.75)_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: dark ? 'linear-gradient(100deg,rgba(2,4,9,.55) 0%,rgba(2,4,9,.2) 60%,rgba(2,4,9,0) 100%)' : 'transparent' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 transition-shadow duration-700" style={{ boxShadow: storm ? 'inset 0 0 160px rgba(255,107,120,.35)' : 'none' }} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] flex flex-wrap items-start gap-2 px-3.5 py-3">
        <h2 id="scene-h" className="label rounded-[7px] border border-line-soft bg-[rgba(7,11,20,.7)] px-2.5 py-[7px] text-ink-2">Outpost · {scenarioOf(m).name}</h2>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 rounded-[7px] border bg-[rgba(7,11,20,.7)] px-2.5 py-1.5 text-xs" style={{ borderColor: dark ? '#FFC66D66' : '#243247', color: dark ? '#FFC66D' : '#C4CEDD' }}><Sun className="size-[13px]" />Sunlight {Math.round(sun * 100)}%</span>
        <span className="flex items-center gap-1.5 rounded-[7px] border bg-[rgba(7,11,20,.7)] px-2.5 py-1.5 text-xs" style={{ borderColor: wx[1] + '66', color: wx[1] }}><Shield className="size-[13px]" />Space weather: {wx[0]}</span>
      </div>

      <svg aria-hidden className="absolute inset-0 z-[1] size-full">
        {mods.filter(d => d.id !== 'hab').map(d => {
          const c = !d.installed ? '#172235' : d.offline ? '#FF6B78' : d.status === 'stable' ? '#2A4A68' : HEX[d.status];
          return <line key={d.id} x1={`${hab.x}%`} y1={`${hab.y}%`} x2={`${d.x}%`} y2={`${d.y}%`} stroke={c} strokeWidth={d.installed ? 2 : 1.5} strokeDasharray={d.installed && !d.offline ? '6 6' : '3 8'} strokeLinecap="round" className={d.installed && !d.offline ? 'animate-[lq-flow_1.6s_linear_infinite]' : undefined} />;
        })}
      </svg>

      {mods.map(d => {
        const on = selected === d.id, S = STATUS[d.status], alert = d.installed && (d.status !== 'stable' || d.offline);
        return (
          <button key={d.id} onClick={() => onSelect(d.id)} aria-pressed={on} aria-label={`${d.label}${d.installed ? `, ${d.offline ? 'offline' : S.label}` : ', not installed'}`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.w, height: d.h, boxShadow: on ? '0 0 0 4px rgba(93,225,255,.14), 0 0 40px -10px #5DE1FF' : alert ? `0 0 30px -10px ${HEX[d.offline ? 'critical' : d.status]}` : 'none' }}
            className={cn('absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 border-[1.5px] p-1.5 backdrop-blur-[4px] transition-[border-color,box-shadow,background-color] hover:border-cyan',
              d.round ? 'rounded-full' : 'rounded-[10px]',
              on ? 'border-cyan bg-[rgba(15,34,51,.92)]' : d.installed ? 'bg-[rgba(13,23,38,.86)]' : 'border-dashed border-line-strong bg-[rgba(13,20,34,.6)]',
              !on && d.installed && (d.status === 'stable' && !d.offline ? 'border-[#2E4560]' : S.border),
              d.installed ? 'text-ink' : 'text-ink-faint')}>
            {alert && <span aria-hidden className="absolute right-[7px] top-[7px] flex size-2"><span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-75', d.offline ? 'bg-critical' : S.fill)} /><span className={cn('relative inline-flex size-2 rounded-full', d.offline ? 'bg-critical' : S.fill)} /></span>}
            <SimIcon name={d.icon} className={d.round ? 'size-6' : 'size-5'} />
            <span className={cn('text-center font-semibold leading-tight', d.round ? 'text-[13px]' : 'text-[11.5px]')}>{d.label}</span>
            <span className={cn('text-center font-mono text-[10px] leading-tight', d.installed ? (d.offline ? 'text-critical' : S.text) : 'text-ink-faint')}>{d.installed ? d.sub : 'Not installed'}</span>
          </button>
        );
      })}

      <div className="absolute inset-x-0 bottom-0 z-[3] flex flex-wrap items-center gap-x-3.5 gap-y-2.5 bg-gradient-to-t from-[rgba(7,11,20,.96)] from-30% to-transparent px-3.5 py-3">
        <div className="min-w-0 flex-[1_1_220px] text-[12.5px] leading-snug text-ink-2"><span className="text-ink-muted">Next day: </span>{tomorrow}</div>
        <Button onClick={onAdvance} disabled={!canAdvance} className={cn('h-[46px] gap-2.5 px-5 tracking-[.05em]', canAdvance && 'shadow-[0_10px_30px_-10px_rgba(93,225,255,.7)]')}><ChevronRight className="size-[17px]" />{advanceText}</Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ telemetry */
const SERIES = [
  { key: 'o2', label: 'Oxygen', color: '#5DE1FF', get: (h: Snapshot) => h.o2 / CAPS.o2 },
  { key: 'water', label: 'Water', color: '#739CFF', get: (h: Snapshot) => h.water / CAPS.water },
  { key: 'food', label: 'Food', color: '#57D9A3', get: (h: Snapshot) => h.food / CAPS.food },
  { key: 'bat', label: 'Battery', color: '#FFC66D', get: (h: Snapshot) => h.battery / h.batteryCap },
] as const;

export function Telemetry({ m }: { m: MissionState }) {
  const N = daysOf(m);
  const proj = useMemo<Snapshot[]>(() => {
    if (m.status !== 'active') return [];
    let s: MissionState = JSON.parse(JSON.stringify(m)); const out: Snapshot[] = [];
    for (let k = 0; k < 7 && s.status === 'active' && s.day < N; k++) { s.pendingEvent = null; s = advanceDay(s); out.push(s.history[s.history.length - 1]); }
    return out;
  }, [m, N]);
  const [hover, setHover] = useState<number | null>(null);
  const X = (d: number) => ((d - 1) / Math.max(1, N - 1)) * 1000, Y = (v: number) => 190 - Math.max(0, Math.min(1, v)) * 180;
  const path = (pts: Snapshot[], get: (h: Snapshot) => number) => pts.map((h, i) => `${i ? 'L' : 'M'}${X(h.day).toFixed(1)},${Y(get(h)).toFixed(1)}`).join(' ');
  const last = m.history[m.history.length - 1];
  const events = m.log.filter(l => l.type === 'event' || l.type === 'failure');
  const H = hover != null ? (m.history.find(h => h.day === hover) ?? proj.find(h => h.day === hover)) : null;
  return (
    <section aria-labelledby="tel-h" className="rounded-xl border border-line-soft bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-3.5 py-3">
        <h2 id="tel-h" className="label text-ink-2">Telemetry · % of capacity</h2>
        <div className="flex flex-wrap gap-3 text-[11.5px] text-ink-muted">
          {SERIES.map(s => <span key={s.key} className="flex items-center gap-1.5"><svg width="16" height="4" aria-hidden><line x1="0" y1="2" x2="16" y2="2" stroke={s.color} strokeWidth="2" /></svg>{s.label}</span>)}
          <span className="flex items-center gap-1.5"><svg width="16" height="4" aria-hidden><line x1="0" y1="2" x2="16" y2="2" stroke="#91A0B7" strokeWidth="2" strokeDasharray="3 3" /></svg>Projected · no changes, no events</span>
        </div>
      </div>
      <figure className="relative px-3 pb-2 pt-2.5">
        <svg role="img" aria-label={`Reserves over time, day 1 to ${N}, with a seven-day projection`} viewBox="0 0 1000 200" preserveAspectRatio="none" className="block h-[170px] w-full"
          onMouseLeave={() => setHover(null)}
          onMouseMove={e => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); setHover(Math.max(1, Math.min(N, Math.round(1 + ((e.clientX - r.left) / r.width) * (N - 1))))); }}>
          <rect x="0" y={Y(.1)} width="1000" height={Y(0) - Y(.1)} fill="rgba(255,107,120,.06)" />
          {[0, .25, .5, .75, 1].map(v => <line key={v} x1="0" x2="1000" y1={Y(v)} y2={Y(v)} stroke="#172235" vectorEffect="non-scaling-stroke" />)}
          {sunOf(m).map((s, i) => s < .5 && <rect key={i} x={X(i + 1) - 1000 / (2 * (N - 1))} y="0" width={1000 / (N - 1)} height="200" fill="rgba(255,198,109,.045)" />)}
          {last && <><rect x={X(last.day)} y="0" width={1000 - X(last.day)} height="200" fill="rgba(145,160,183,.04)" /><line x1={X(last.day)} x2={X(last.day)} y1="0" y2="200" stroke="#3A4E6B" vectorEffect="non-scaling-stroke" /></>}
          {events.map((e, i) => <line key={i} x1={X(e.day)} x2={X(e.day)} y1="0" y2="200" stroke={e.type === 'failure' ? '#FF6B78' : '#FFC66D'} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
          {SERIES.map(s => <g key={s.key}>
            <path d={path(m.history, s.get)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="transition-[d] duration-500" />
            {last && proj.length > 0 && <path d={path([last, ...proj], s.get)} fill="none" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 4" opacity=".55" vectorEffect="non-scaling-stroke" />}
          </g>)}
          {H && <line x1={X(H.day)} x2={X(H.day)} y1="0" y2="200" stroke="#F3F7FC" strokeOpacity=".5" vectorEffect="non-scaling-stroke" />}
        </svg>
        {H && (
          <div className="pointer-events-none absolute top-3 rounded-lg border border-line bg-[#0B111D]/95 px-3 py-2 text-[11.5px] shadow-xl" style={{ left: `clamp(12px, calc(${(X(H.day) / 1000) * 100}% - 70px), calc(100% - 160px))` }}>
            <div className="label mb-1 text-[10px] text-ink-muted">Day {pad2(H.day)} {H.day > (last?.day ?? 0) ? '· projected' : ''}</div>
            {SERIES.map(s => <div key={s.key} className="tnum flex justify-between gap-4"><span style={{ color: s.color }}>{s.label}</span><span>{Math.round(s.get(H) * 100)}%</span></div>)}
          </div>
        )}
        <figcaption className="flex justify-between gap-2.5 pt-1.5 font-mono text-[10px] text-ink-faint"><span>DAY 1</span><span>NOW · DAY {pad2(m.day)}</span><span>DAY {N}</span></figcaption>
      </figure>
    </section>
  );
}

/* ------------------------------------------------------------ decision panel + feed */
export function DecisionPanel({ m, R, A, selected, onUpgrade }: { m: MissionState; R: ResourceView; A: Alert[]; selected: ModuleId; onUpgrade: (id: EquipmentId) => void }) {
  const mods = useModules(m, R), d = mods.find(x => x.id === selected)!, S = STATUS[d.status];
  const e = selected === 'hab' ? null : EQUIPMENT.find(x => x.id === selected)!, L = m.levels, nc = e ? nextCost(e.id, L[e.id]) : null;
  const QA: Record<ModuleId, [string, string, string]> = {
    hab: [`Crew health is ${Math.round(m.health)} / 100 and morale ${Math.round(m.morale)}.`, m.health >= 70 ? 'Air, water and food are all being supplied.' : 'Recent shortages or radiation exposure have hurt crew health.', m.health >= 70 ? 'The crew stays fit for science.' : 'Health keeps falling until shortages are fixed.'],
    solar: [`Arrays are making ${f0(R.power.gen)} kWh today at ${Math.round(R.power.sun * 100)}% sunlight.`, R.power.sun < .5 ? 'Terrain is shadowing the site.' : 'The site is in good sunlight.', R.power.net >= 0 ? 'The battery keeps charging.' : `The battery drains about ${f0(-R.power.net)} kWh per day.`],
    battery: [`${f0(R.power.value)} of ${R.power.cap} kWh stored.`, `Generation ${f0(R.power.gen)} kWh vs use ${f0(R.power.load)} kWh per day.`, R.power.net >= 0 ? 'It stays charged at today’s rates.' : `Empty in about ${Math.max(0, Math.floor(R.power.days))} days — then machines are switched off.`],
    oxygen: [`${f1(R.o2.value)} kg of oxygen in the tank.`, `The generator makes ${f1(R.o2.production)} kg/day; the crew breathes ${f1(R.o2.consumption)} kg/day.`, R.o2.net >= 0 ? 'Oxygen holds steady.' : `The tank lasts about ${Math.max(0, Math.floor(R.o2.days))} more days.`],
    recycler: [`${f0(R.water.value)} L stored; recycler ${R.water.recOn ? `recovering ${Math.round(R.water.recycling * 100)}%` : 'offline'}.`, `Crew uses ${f0(R.water.consumption)} L/day, and making oxygen splits water too.`, R.water.net >= 0 ? 'Water holds steady.' : `Water lasts about ${Math.max(0, Math.floor(R.water.days))} more days.`],
    greenhouse: [R.food.production ? `Harvesting ${f1(R.food.production)} kg of food per day.` : L.greenhouse ? 'Plants are still growing.' : 'No greenhouse is built.', `The crew eats ${f1(R.food.consumption)} kg/day.`, R.food.net >= 0 ? 'Food holds steady.' : `Food lasts about ${Math.max(0, Math.floor(R.food.days))} more days.`],
    shielding: [`Shelter rating: ${R.radiation.tier}.`, `Space weather is ${R.radiation.risk.toLowerCase()}.`, L.shielding >= 2 ? 'The crew is well protected in a storm.' : 'A storm would raise crew exposure.'],
    reserves: ['', '', ''],
  };
  const qa = QA[selected];
  const feed: { title: string; text: string; when: string; level: Status }[] = [...A.map(a => ({ title: a.title, text: a.text, when: 'NOW', level: a.level as Status })),
    ...m.log.slice(-8).reverse().filter(l => l.type !== 'decision' || /:/.test(l.text)).map(l => ({ title: l.text, text: l.cause ?? '', when: `D${pad2(l.day)}`, level: (l.type === 'event' || l.type === 'failure' ? 'critical' : l.type === 'alert' ? 'warning' : 'stable') as Status }))].slice(0, 10);
  return (
    <aside aria-label="Decision panel" className="flex min-w-0 flex-col gap-3">
      <section aria-live="polite" aria-labelledby="dec-h" className={cn('overflow-hidden rounded-xl border bg-surface', d.status === 'stable' ? 'border-line-soft' : S.border)}>
        <div className="h-0.5" style={{ background: HEX[d.status] }} />
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-[10px]', S.bg, S.text)}><SimIcon name={d.icon} className="size-5" /></span>
          <div className="min-w-0 flex-1"><div className="label mb-[5px] text-[10px] text-ink-faint">{e ? `Level ${L[e.id]} of ${e.max}` : 'Pressurized module'}</div><h2 id="dec-h" className="text-[17px] font-semibold tracking-[-.01em]">{e ? e.name : 'Habitat & crew'}</h2></div>
          <span className={cn('flex items-center gap-[5px] whitespace-nowrap text-xs font-medium', S.text)}><S.icon className="size-[13px]" />{S.label}</span>
        </div>
        <ol className="px-4 pb-1 pt-1.5">
          {[["What's happening", qa[0]], ['Why', qa[1]], ['If nothing changes', qa[2]]].map(([q, a], i) => (
            <li key={q} className="grid grid-cols-[22px_1fr] gap-2.5 border-b border-[#172235] py-[11px]">
              <span className="font-mono text-[11px] leading-[1.6] text-cyan">0{i + 1}</span>
              <span><span className="label mb-1.5 block text-[10px] text-ink-muted">{q}</span><span className={cn('block text-[13.5px] leading-normal', i === 2 && d.status !== 'stable' ? S.text : 'text-ink')}>{a}</span></span>
            </li>))}
        </ol>
        <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3">
          <div className="label text-[10px] text-ink-muted">04 · What you can do</div>
          {e && nc != null ? (
            <div className="flex flex-col gap-2.5 rounded-[10px] border border-line bg-well p-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[12.5px]">
                <div><div className="mb-0.5 font-mono text-[10px] text-ink-faint">NOW · L{L[e.id]}</div><div className="tnum">{L[e.id] ? e.effect(L[e.id]) : 'Not installed'}</div></div>
                <ArrowRight className="size-3.5 text-cyan" />
                <div><div className="mb-0.5 font-mono text-[10px] text-ink-faint">AFTER · L{L[e.id] + 1}</div><div className="tnum text-cyan">{e.effect(L[e.id] + 1)}</div></div>
              </div>
              <Button variant={m.credits >= nc ? 'default' : 'secondary'} disabled={m.credits < nc || m.status !== 'active'} onClick={() => onUpgrade(e.id)} className="h-[38px]"><Wrench />{m.credits >= nc ? `Upgrade · ${nc} cr` : `Need ${nc - m.credits} more credits`}</Button>
            </div>
          ) : <p className="text-[12.5px] leading-normal text-ink-muted">{e ? 'Fully upgraded.' : 'Select a system on the map to see how to improve it.'}</p>}
          <Link href="/science" className="flex h-[34px] items-center gap-1.5 self-start rounded-lg border border-line-strong px-3 text-[12.5px] font-medium hover:border-cyan"><FlaskConical className="size-3.5" />Learn the science</Link>
        </div>
      </section>
      <section aria-labelledby="feed-h" className="rounded-xl border border-line-soft bg-surface">
        <div className="flex items-center gap-2 border-b border-line-soft px-3.5 py-3"><h2 id="feed-h" className="label flex-1 text-ink-2">Alerts &amp; events</h2>
          <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold', A.some(a => a.level === 'critical') ? 'bg-critical text-[#1A0508]' : A.length ? 'bg-warning text-[#1A0508]' : 'bg-line-faint text-ink-muted')}>{A.length}</span></div>
        <ul role="log" aria-live="polite" className="flex max-h-[360px] flex-col gap-1 overflow-auto p-1.5 [scrollbar-gutter:stable]">
          {!feed.length && <li className="flex gap-2.5 p-2.5 text-[13px] text-ink-muted"><CheckCircle2 className="size-4 text-success" />All systems within normal limits.</li>}
          {feed.map((f, i) => { const F = STATUS[f.level], Icon = f.level === 'critical' ? OctagonAlert : f.level === 'warning' ? AlertTriangle : CheckCircle2; return (
            <li key={i} className={cn('grid grid-cols-[18px_1fr] gap-[9px] rounded-lg border px-2.5 py-[9px]', f.when === 'NOW' ? (f.level === 'critical' ? 'border-critical/30 bg-critical/[.07]' : 'border-warning/20 bg-warning/[.05]') : 'border-transparent')}>
              <Icon className={cn('mt-px size-[15px]', F.text)} />
              <span className="min-w-0 text-[12.5px] leading-snug"><span className="flex justify-between gap-2"><span className="font-medium">{f.title}</span><span className="shrink-0 font-mono text-[10.5px] leading-[1.6] text-ink-faint">{f.when}</span></span>{f.text && <span className="block text-ink-muted">{f.text}</span>}</span>
            </li>); })}
        </ul>
      </section>
    </aside>
  );
}
