'use client';

import { useEffect, useState } from 'react';
import { Activity, BookOpen, ExternalLink, Layers, RotateCcw, Settings2, Sun, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { P, TIER, type SpaceWeather } from '@/lib/sim';
import { cn } from '@/lib/utils';

type Kind = 'data' | 'ref' | 'assume' | 'game';
const KIND: Record<Kind, { label: string; Icon: LucideIcon; cls: string; text: string }> = {
  ref: { label: 'NASA reference', Icon: BookOpen, cls: 'text-cyan bg-cyan/10', text: 'Facts from NASA publications.' },
  data: { label: 'NASA data', Icon: Activity, cls: 'text-success bg-success/10', text: 'Records from a NASA database.' },
  assume: { label: 'Simplified assumption', Icon: Layers, cls: 'text-blue bg-blue/10', text: 'A real idea, made simpler for the game.' },
  game: { label: 'Game rule', Icon: Settings2, cls: 'text-warning bg-warning/10', text: 'A number we chose so the game is fair.' },
};

const SOURCES: { k: Kind; name: string; org: string; date: string; url: string | null; mode: string; use: string; limit: string }[] = [
  { k: 'data', name: 'DONKI — Space Weather Database Of Notifications, Knowledge, Information (FLR, SEP)', org: 'NASA / Community Coordinated Modeling Center', date: 'Queried live, last 30 days', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', mode: 'Live or cached', use: 'Sets the storm severity tier (high, elevated or moderate) when a mission starts.', limit: 'An event catalog, not a radiation measurement at the Moon. Severity tiers are our game interpretation.' },
  { k: 'data', name: 'OSDR — Environmental Data: BION-M1 radiation dosimetry', org: 'NASA Open Science Data Repository', date: 'Archived dataset', url: 'https://www.nasa.gov/reference/osdr-environmental-data/', mode: 'Archived · shown as a fact', use: 'Quoted in the solar-storm science panel and the Science Lab: detectors recorded about 0.6–1.4 milligray of absorbed dose per day.', limit: 'Measured inside an uncrewed biosatellite in Earth orbit — not on astronauts and not on the Moon. Not used in calculations.' },
  { k: 'ref', name: 'Environmental Control and Life Support System (ECLSS) fact sheet', org: 'NASA Marshall Space Flight Center', date: '2025', url: 'https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf', mode: 'Static reference', use: 'Science Lab text on oxygen generation and water recovery on the space station.', limit: 'Space-station systems; LunaQuest uses lower recovery rates (75–95 %) so upgrades matter.' },
  { k: 'ref', name: 'Deep Space Radiation Measurements and Crew Radiation Protection for Artemis', org: 'NASA Technical Reports Server (NTRS 20250002757)', date: '2025', url: 'https://ntrs.nasa.gov/citations/20250002757', mode: 'Static reference', use: 'Explains why storm shelters and shielding mass protect the crew.', limit: 'The game’s exposure index is abstract; no doses are calculated.' },
  { k: 'ref', name: 'Fission Surface Power Project Energizes Lunar Exploration', org: 'NASA Glenn Research Center', date: 'NASA feature', url: 'https://www.nasa.gov/centers-and-facilities/glenn/nasas-fission-surface-power-project-energizes-lunar-exploration', mode: 'Static reference', use: 'Context for First Lunar Night: why solar-only bases struggle in the dark.', limit: 'Fission power is not playable in this version.' },
  { k: 'ref', name: 'Growing Plants in Space · Veggie', org: 'NASA', date: 'NASA features', url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/', mode: 'Static reference', use: 'Explains why crops need light, water and time before harvest.', limit: 'Crop yields are game values, not experiment results.' },
  { k: 'ref', name: 'Moon Base artist’s renderings', org: 'NASA', date: '2026 gallery', url: 'https://www.nasa.gov/', mode: 'Imagery only', use: 'Pictures on the landing page, mission cards and Mission Control.', limit: 'Artist’s concepts, not photographs or mission footage.' },
  { k: 'assume', name: 'Lunar day/night cycle', org: 'Physical fact, simplified', date: '—', url: null, mode: 'Simplified', use: 'First Lunar Night: 8 sunlit days, then 14 dark days. Polar scenarios use a shorter terrain-shadow dip.', limit: 'Real illumination depends on latitude and terrain; profiles are illustrative.' },
  { k: 'assume', name: 'Earth–Moon communication delay', org: 'Physical fact', date: '—', url: null, mode: 'Simulated', use: 'Ask Mission Control during an emergency: about 2.6 s round trip at Moon distance. The Mars-distance drill makes the reply arrive the next day.', limit: 'Real Mars delays are minutes; the game compresses them into one day.' },
  { k: 'game', name: 'Budget, costs, yields, capacities and event chances', org: 'LunaQuest team', date: 'v2 engine', url: null, mode: 'Game balancing', use: 'Every credit cost, kWh, litre and kilogram in the outpost, and how likely each emergency is. Listed below.', limit: 'Chosen for learning and balance. Not engineering data.' },
];

const LIMITS = [
  ['No real radiation doses', 'Exposure is an abstract risk index. Shielding lowers risk but never removes it.'],
  ['Simplified life support', 'Carbon dioxide removal, pressure, fire safety and spare parts are not modelled.'],
  ['One step per day', 'Real systems change minute by minute. The game sums each day into one step.'],
  ['Fixed sunlight profiles', 'Each scenario uses an illustrative sunlight curve, not a terrain model of a real site.'],
  ['Mars is planned', 'The Mars Outpost is designed but not playable in this version.'],
  ['Not yet tested with students', 'Learning benefits are goals. We have not measured them yet.'],
];

const when = (t?: number | null) => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');

export function SourcesView() {
  const [sw, setSw] = useState<SpaceWeather | null>(null), [loading, setLoading] = useState(true), [filter, setFilter] = useState<'all' | Kind>('all');
  const load = () => { setLoading(true); fetch('/api/space-weather', { cache: 'no-store' }).then(r => r.json()).then(setSw).catch(() => setSw({ status: 'curated', tier: 'elevated' } as SpaceWeather)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const st = sw?.status ?? 'curated';
  const tone = loading && !sw ? 'text-ink-muted border-line' : st === 'live' ? 'text-success border-success/40' : st === 'cached' ? 'text-cyan border-cyan/35' : 'text-warning border-warning/40';
  const statusText = loading && !sw ? 'Connecting…' : st === 'live' ? 'Retrieved from NASA just now' : st === 'cached' ? 'Cached NASA record' : 'NASA unavailable';
  const s = sw as (SpaceWeather & { label?: string; detail?: string; note?: string; range?: [string, string]; endpoint?: string; fetchedAt?: number; record?: { link?: string | null } | null; error?: string }) | null;
  const active = sw?.tier ?? 'elevated';
  const tiers = ([['high', 'High', 'Particle event in the last 30 days', 'border-critical text-critical'], ['elevated', 'Elevated', 'X-class flare, or no data (default)', 'border-warning text-warning'], ['moderate', 'Moderate', 'Smaller flares or a quiet Sun', 'border-success text-success']] as const);
  const params: [string, string, Kind][] = [
    ['Oxygen per astronaut', `${P.o2PerCrew} kg/day`, 'assume'], ['Water per astronaut', `${P.waterPerCrew} L/day`, 'game'], ['Food per astronaut', `${P.foodPerCrew} kg/day`, 'game'],
    ['Water to make 1 kg O₂', `${P.electrolysis} kg`, 'assume'], ['O₂ generator output', `${P.o2Gen.slice(1).join(' / ')} kg/day`, 'game'], ['Water recovery', P.recRate.slice(1).map(r => Math.round(r * 100) + '%').join(' / '), 'game'],
    ['Solar output per array', `${P.solarPerLevel} kWh/day at full sun`, 'game'], ['Battery', `${P.batteryBase} + ${P.batteryPerLevel}/level kWh`, 'game'], ['Habitat base load', `${P.baseLoad} kWh/day`, 'game'],
    ['Research load', `${P.researchLoad} kWh/day`, 'game'], ['First harvest', `Day ${P.ghMature}`, 'game'], ['Shelter blocks', `${P.shieldPF.map(x => Math.round(x * 100) + '%').join(' / ')} of storm hazard`, 'game'],
  ];
  const rows = SOURCES.filter(r => filter === 'all' || r.k === filter);

  return (
    <main className="mx-auto flex flex-col gap-7 px-5 pb-24 pt-[clamp(32px,5vw,56px)] md:px-12">
      <section className="grid items-end gap-7 lg:grid-cols-2">
        <div>
          <h1 className="mb-3.5 text-[clamp(32px,4vw,50px)] font-semibold leading-[1.02] tracking-[-.03em]">Where our numbers come from</h1>
          <p className="max-w-[600px] text-[17px] leading-relaxed text-ink-2 text-pretty">LunaQuest is a game, not an engineering tool. Some things come from NASA. Others are simple rules we made so the game is fair and fun. This page shows which is which.</p>
        </div>
        <ul aria-label="Kinds of information" className="grid grid-cols-2 gap-2">
          {(Object.keys(KIND) as Kind[]).map(k => { const K = KIND[k]; return (
            <li key={k} className="flex items-start gap-2.5 rounded-[10px] border border-line-soft bg-surface px-3.5 py-3">
              <span className={cn('mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-md', K.cls)}><K.Icon className="size-3.5" /></span>
              <span><span className="block text-sm font-semibold">{K.label}</span><span className="text-[12.5px] leading-snug text-ink-muted">{K.text}</span></span>
            </li>); })}
        </ul>
      </section>

      <section aria-labelledby="sw-h" className={cn('overflow-hidden rounded-2xl border bg-surface', tone.split(' ')[1])}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line-soft px-5 py-4">
          <Sun className="size-[18px]" />
          <h2 id="sw-h" className="label text-ink-2">Live NASA data · DONKI space weather</h2>
          <span role="status" className={cn('flex h-[26px] items-center rounded-full border px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[.1em]', tone)}>{statusText}</span>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}><RotateCcw />{loading ? 'Checking…' : 'Refresh from NASA'}</Button>
        </div>
        <div className="grid gap-px bg-line-soft md:grid-cols-2">
          <div className="flex flex-col gap-2.5 bg-surface p-5">
            <div className="label">What NASA reported</div>
            <div aria-live="polite" className="text-xl font-semibold leading-snug">{st === 'curated' ? 'No recent record could be loaded' : s?.label ?? '—'}</div>
            <p className="text-sm leading-relaxed text-ink-2">{st === 'curated' ? 'NASA could not be reached right now. The game still runs; storm severity uses its default (elevated) level, and no data were substituted.' : s?.detail ?? s?.note ?? ''}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-[13px]">
              <dt className="text-ink-muted">Dataset</dt><dd>NASA DONKI · solar flares (FLR) and solar energetic particles (SEP)</dd>
              <dt className="text-ink-muted">Date range</dt><dd className="tnum">{s?.range ? `${s.range[0]} → ${s.range[1]}` : '—'}</dd>
              <dt className="text-ink-muted">Retrieved</dt><dd className="tnum">{when(s?.fetchedAt)}</dd>
              <dt className="text-ink-muted">Endpoint</dt><dd>{s?.endpoint ?? '—'}</dd>
              <dt className="text-ink-muted">Record</dt><dd>{s?.record?.link ? <a href={s.record.link} target="_blank" rel="noopener noreferrer">Open on NASA DONKI</a> : <span className="text-ink-muted">—</span>}</dd>
            </dl>
          </div>
          <div className="flex flex-col gap-3 bg-surface p-5">
            <div className="label">How the game uses it</div>
            <div className="flex gap-2">
              {tiers.map(([id, name, rule, cls]) => (
                <div key={id} className={cn('flex-1 rounded-[10px] border-[1.5px] p-3', id === active ? cls : 'border-line bg-well')}>
                  <div className={cn('font-mono text-[10.5px] font-semibold uppercase tracking-[.12em]', id === active ? '' : 'text-ink-muted')}>{name}</div>
                  <div className="tnum mt-1.5 text-xl font-semibold text-ink">×{TIER[id]}</div>
                  <div className="mt-1 text-xs leading-snug text-ink-muted">{rule}</div>
                </div>))}
            </div>
            <p className="text-sm leading-relaxed text-ink-2">When a new mission starts, the record above sets the <b>storm severity</b>. Higher severity makes sheltering the crew matter more. It is a game rule we chose, so it is labelled <b className="text-warning">game interpretation</b>.</p>
            <p className="rounded-[10px] border border-line-soft bg-well px-3.5 py-3 text-[13px] leading-relaxed text-ink-2"><b className="text-ink">What this data cannot tell us.</b> DONKI catalogs solar events seen from spacecraft near Earth and the Sun. It does not measure radiation on the Moon’s surface, so LunaQuest never turns it into a real dose.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="src-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="src-h" className="text-2xl font-semibold tracking-[-.015em]">Every source, and what it does in the game</h2>
          <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-1.5">
            {([['all', 'All'], ['data', 'NASA data'], ['ref', 'NASA reference'], ['assume', 'Simplified'], ['game', 'Game rules']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id} className={cn('h-8 rounded-full border px-3 text-[12.5px] font-medium', filter === id ? 'border-cyan bg-cyan text-cyan-ink' : 'border-line-strong text-ink-2 hover:border-cyan')}>{label}</button>))}
          </div>
        </div>
        {rows.map(r => { const K = KIND[r.k]; return (
          <article key={r.name} className="grid gap-x-6 gap-y-3.5 rounded-[14px] border border-line-soft bg-surface px-5 py-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className={cn('flex h-6 items-center gap-1.5 self-start rounded-md px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[.1em]', K.cls)}><K.Icon className="size-3" />{K.label}</span>
              <h3 className="font-semibold leading-snug">{r.name}</h3>
              <div className="text-[13px] text-ink-muted">{r.org} · {r.date}</div>
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px]">Open original<ExternalLink className="size-3" /></a>}
            </div>
            <div className="text-sm leading-relaxed text-ink-2"><div className="label mb-2 text-cyan">Used for</div>{r.use}</div>
            <div className="text-sm leading-relaxed text-ink-2"><div className="label mb-2 text-warning">Limits · {r.mode}</div>{r.limit}</div>
          </article>); })}
      </section>

      <section aria-labelledby="par-h" className="overflow-hidden rounded-2xl border border-line-soft bg-surface">
        <h2 id="par-h" className="label border-b border-line-soft px-5 py-4 text-ink-2">Game rules in numbers · one day = one step</h2>
        <div role="table" aria-label="Simulation parameters" className="overflow-x-auto">
          <div role="row" className="grid min-w-[560px] grid-cols-[1.4fr_1fr_1.2fr] border-b border-line-faint px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[.12em] text-ink-faint"><span role="columnheader">Parameter</span><span role="columnheader">Value</span><span role="columnheader">Kind</span></div>
          {params.map(([k, v, kind]) => { const K = KIND[kind]; return (
            <div key={k} role="row" className="grid min-w-[560px] grid-cols-[1.4fr_1fr_1.2fr] border-b border-line-faint px-5 py-2.5 text-[13.5px]">
              <span role="cell" className="text-ink-2">{k}</span><span role="cell" className="tnum">{v}</span>
              <span role="cell" className={cn('flex items-center gap-1.5 bg-transparent', K.cls.split(' ')[0])}><K.Icon className="size-3.5" />{K.label}</span>
            </div>); })}
        </div>
        <p className="px-5 py-3.5 text-[13px] leading-relaxed text-ink-muted">Unit convention: 1 litre of water ≈ 1 kg. Making 1 kg of oxygen splits 1.125 kg of water (the 8 : 1 mass ratio of oxygen to hydrogen in water). “Days left” values are estimates at today’s rates; sunlight and random events change them.</p>
      </section>

      <section aria-labelledby="lim-h" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <h2 id="lim-h" className="col-span-full text-2xl font-semibold tracking-[-.015em]">What LunaQuest simplifies or leaves out</h2>
        {LIMITS.map(([t, d]) => <div key={t} className="rounded-xl border border-line-soft bg-surface px-4 py-4"><div className="mb-1.5 font-semibold">{t}</div><div className="text-[13.5px] leading-relaxed text-ink-2">{d}</div></div>)}
      </section>

      <p className="text-[13px] leading-relaxed text-ink-faint">LunaQuest is built for NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Game values must not be used to design real spacecraft or protect real astronauts.</p>
    </main>
  );
}
