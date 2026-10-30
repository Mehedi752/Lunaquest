'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Check, Eye, FlaskConical, Package, Wrench, X, Zap } from 'lucide-react';
import { useMissionCtx } from '@/components/lq/mission/shell';
import { SectionLabel } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CAPS, autoplay, type LogType, type MissionState } from '@/lib/sim';
import { cn, pad2 } from '@/lib/utils';

const SERIES = [
  { id: 'o2', label: 'Oxygen', color: '#5DE1FF', dash: '0' },
  { id: 'water', label: 'Water', color: '#739CFF', dash: '8 4' },
  { id: 'food', label: 'Food', color: '#57D9A3', dash: '2 4' },
  { id: 'battery', label: 'Battery', color: '#E8EEF7', dash: '12 4 2 4' },
] as const;
type SeriesId = (typeof SERIES)[number]['id'];
const PERIODS: [number, number, string][] = [[1, 30, 'All'], [1, 10, 'D1–10'], [11, 20, 'D11–20'], [21, 30, 'D21–30']];
const LOG: Record<LogType, [string, React.ElementType]> = {
  decision: ['text-cyan', Check], event: ['text-warning', AlertTriangle], failure: ['text-critical', X], repair: ['text-success', Wrench],
  objective: ['text-success', FlaskConical], purchase: ['text-blue', Package], alert: ['text-warning', Zap],
};

export default function TimelinePage() {
  const { mission } = useMissionCtx();
  const [sample, setSample] = useState(false);
  const sampleSim = useMemo(() => (sample ? autoplay('success') : null), [sample]);
  const view: MissionState = sampleSim ?? mission;

  const [on, setOn] = useState<SeriesId[]>(['o2', 'water', 'food', 'battery']);
  const [period, setPeriod] = useState('0');
  const [marker, setMarker] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [d0, d1] = PERIODS[Number(period)];

  const data = view.history.filter(h => h.day >= d0 && h.day <= d1).map(h => ({
    day: h.day, o2: (h.o2 / CAPS.o2) * 100, water: (h.water / CAPS.water) * 100, food: (h.food / CAPS.food) * 100, battery: (h.battery / h.batteryCap) * 100,
  }));
  const events = view.log.filter(l => (l.type === 'event' || l.type === 'failure') && l.day >= d0 && l.day <= d1);

  const mk = marker === null ? null : (() => {
    const logs = view.log.filter(l => l.day === marker && l.type !== 'alert');
    const h0 = view.history.find(h => h.day === marker) ?? view.history[0];
    const h2 = view.history.find(h => h.day === marker + 2) ?? view.history[view.history.length - 1];
    const d = (k: 'o2' | 'water' | 'food' | 'battery', label: string, u: string) => {
      const v = h2[k] - h0[k];
      return { label, v: `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))} ${u}`, cls: v < -1 ? 'text-critical-soft' : v > 1 ? 'text-success' : 'text-ink-2' };
    };
    const lines = logs.filter(l => l.type !== 'event').map(l => (l.cause ? `${l.text} — ${l.cause}` : l.text));
    return { title: logs.find(l => l.type === 'event' || l.type === 'failure')?.text ?? 'Event', lines: lines.length ? lines : ['No decision recorded yet for this event.'],
      deltas: [d('o2', 'Oxygen', 'kg'), d('water', 'Water', 'L'), d('food', 'Food', 'kg'), d('battery', 'Battery', 'kWh')] };
  })();

  const rows = view.log.filter(l => filter === 'all' || l.type === filter
    || (filter === 'alert' && (l.type === 'failure' || l.type === 'repair')) || (filter === 'decision' && l.type === 'purchase')).slice().reverse();

  return (
    <main aria-label="Mission timeline and resource history" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><SectionLabel className="mb-2.5 text-[11px]">Mission analysis</SectionLabel><h1 className="text-[clamp(26px,3vw,36px)] font-semibold tracking-[-.025em]">Timeline &amp; Resource History</h1></div>
        <Button variant="secondary" size="sm" aria-pressed={sample} onClick={() => { setSample(s => !s); setMarker(null); }} className={cn(sample && 'border-cyan')}>
          <Eye />{sample ? 'Showing sample mission — show mine' : 'Preview with a sample 30-day mission'}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-wrap gap-x-4 gap-y-2.5 py-3.5">
          <CardTitle className="flex-none">Reserves · % of capacity</CardTitle>
          <div role="group" aria-label="Resources shown" className="flex flex-wrap gap-1.5">
            {SERIES.map(s => { const sel = on.includes(s.id); return (
              <button key={s.id} aria-pressed={sel} onClick={() => setOn(o => (sel ? o.filter(x => x !== s.id) : [...o, s.id]))}
                className={cn('flex h-[30px] items-center gap-1.5 rounded-[7px] border px-2.5 text-xs font-medium', sel ? 'border-line-strong bg-elevated text-ink' : 'border-line-soft text-ink-faint')}>
                <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} /></svg>{s.label}
              </button>
            ); })}
          </div>
          <div className="flex-1" />
          <ToggleGroup type="single" value={period} onValueChange={v => { if (v) { setPeriod(v); setMarker(null); } }} aria-label="Time period">
            {PERIODS.map((p, i) => <ToggleGroupItem key={p[2]} value={String(i)}>{p[2]}</ToggleGroupItem>)}
          </ToggleGroup>
        </CardHeader>
        <figure className="px-3 pb-3 pt-4">
          <div className="h-[clamp(220px,30vw,320px)]" role="img" aria-label={`Line chart of reserves as percent of capacity, days ${d0} to ${d1}`}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#172235" vertical={false} />
                <ReferenceArea y1={0} y2={10} fill="rgba(255,107,120,.06)" />
                <XAxis dataKey="day" type="number" domain={[d0, d1]} tickFormatter={d => `D${d}`} tick={{ fill: '#6F7D93', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }} stroke="#243247" />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#6F7D93', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }} stroke="#243247" />
                <Tooltip contentStyle={{ background: '#0D1422', border: '1px solid #2E3F58', borderRadius: 8, fontSize: 12 }} labelFormatter={d => `Day ${d}`} formatter={v => `${Math.round(Number(v))}%`} />
                {events.map(e => (
                  <ReferenceLine key={`${e.day}-${e.text}`} x={e.day} stroke={e.type === 'failure' || e.severity === 'critical' ? '#FF6B78' : '#FFC66D'} strokeDasharray="3 4" />
                ))}
                {SERIES.filter(s => on.includes(s.id)).map(s => (
                  <Line key={s.id} dataKey={s.id} name={s.label} stroke={s.color} strokeDasharray={s.dash} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
            {events.map(e => {
              const crit = e.type === 'failure' || e.severity === 'critical';
              return (
                <button key={`${e.day}-${e.text}`} onClick={() => setMarker(e.day)} aria-pressed={marker === e.day}
                  className={cn('flex h-7 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px]', crit ? 'border-critical text-critical' : 'border-warning text-warning', marker === e.day && (crit ? 'bg-critical/15' : 'bg-warning/15'))}>
                  {e.type === 'failure' ? <X className="size-3" /> : <AlertTriangle className="size-3" />}D{pad2(e.day)} · {e.text}
                </button>
              );
            })}
          </div>
          <figcaption className="mt-2.5 px-1.5 text-xs text-ink-faint">Normalized to each resource’s capacity. Shaded band = critical zone (below 10%). Select an event to inspect what happened.</figcaption>
        </figure>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className={cn(mk && 'border-[#2E4560]')}>
          <CardHeader><CardTitle>Event inspector</CardTitle></CardHeader>
          {!mk ? <p className="px-4 py-5 text-[13px] leading-relaxed text-ink-muted">Select an event marker on the chart to see what caused a change in your reserves.</p> : (
            <div className="flex flex-col gap-3 px-4 py-3.5">
              <div className="flex items-center gap-2.5"><span className="font-mono text-[11px] text-cyan">DAY {pad2(marker!)}</span><span className="font-semibold">{mk.title}</span></div>
              {mk.lines.map(l => <p key={l} className="text-[13px] leading-relaxed text-ink-2">{l}</p>)}
              <div className="label text-[10px] text-ink-faint">Change over next 2 days</div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {mk.deltas.map(d => <div key={d.label} className="rounded-lg border border-line-faint bg-well p-2"><div className="text-[11px] text-ink-muted">{d.label}</div><div className={cn('tnum text-sm font-semibold', d.cls)}>{d.v}</div></div>)}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader className="flex-wrap">
            <CardTitle>Mission log</CardTitle>
            <ToggleGroup type="single" value={filter} onValueChange={v => v && setFilter(v)} aria-label="Filter log">
              {[['all', 'All'], ['decision', 'Decisions'], ['event', 'Events'], ['alert', 'Failures']].map(([v, l]) => <ToggleGroupItem key={v} value={v}>{l}</ToggleGroupItem>)}
            </ToggleGroup>
          </CardHeader>
          <ol className="max-h-[420px] overflow-auto px-4 pb-3 pt-1.5">
            {rows.map((l, i) => { const [c, I] = LOG[l.type]; return (
              <li key={i} className="grid grid-cols-[52px_20px_1fr] gap-2.5 border-b border-line-faint py-2.5 text-[13px] leading-snug last:border-0">
                <span className="font-mono text-[11px] leading-6 text-ink-faint">DAY {pad2(l.day)}</span>
                <I className={cn('mt-0.5 size-[15px]', c)} />
                <span><span className="block">{l.text}</span>{l.cause && <span className="text-[12.5px] text-ink-muted">{l.cause}</span>}</span>
              </li>
            ); })}
          </ol>
        </Card>
      </div>

      <section aria-label="Mission summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Days completed', `${view.history.length - 1} / ${view.days ?? 30}`], ['Objectives completed', `${view.objectives.filter(o => o.done).length} / 5`],
          ['Power-shortfall days', String(view.brownoutDays)], ['Crew status', view.status === 'failed' ? 'Evacuated' : `4 / 4 · health ${Math.round(view.health)}`]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line-soft bg-surface px-4 py-3.5"><div className="mb-1.5 text-xs text-ink-muted">{k}</div><div className="tnum text-[22px] font-semibold">{v}</div></div>
        ))}
      </section>
    </main>
  );
}
