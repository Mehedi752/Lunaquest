'use client';

import { ArrowRight, Globe, Moon, Package, Radiation, RadioTower, SunMoon, Weight, Wind, type LucideIcon } from 'lucide-react';
import { SectionLabel } from '@/components/lq/status';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';

/**
 * Moon-vs-Mars comparison. Each factor carries the physical fact, the gameplay
 * consequence and a mission-pressure level, so the contrast reads at a glance
 * instead of being buried in table text. Rows reveal on scroll; the global
 * reduced-motion rule in globals.css disables the motion.
 */

type Pressure = 0 | 1 | 2 | 3;
interface Side { value: string; effect: string; p: Pressure }
interface Row { factor: string; icon: LucideIcon; moon: Side; mars: Side }

const PRESSURE: Record<Pressure, { label: string; bar: string; text: string }> = {
  0: { label: 'Not modelled', bar: 'bg-ink-faint', text: 'text-ink-faint' },
  1: { label: 'Manageable', bar: 'bg-success', text: 'text-success' },
  2: { label: 'Demanding', bar: 'bg-warning', text: 'text-warning' },
  3: { label: 'Severe', bar: 'bg-critical', text: 'text-critical-soft' },
};

const ROWS: Row[] = [
  { factor: 'Gravity', icon: Weight,
    moon: { value: 'About 1/6 of Earth’s', effect: 'Not modelled', p: 0 },
    mars: { value: 'About 3/8 of Earth’s', effect: 'Not modelled', p: 0 } },
  { factor: 'Day & night', icon: SunMoon,
    moon: { value: 'About 14.5 Earth days of night', effect: 'Long shadow periods stress power', p: 3 },
    mars: { value: 'One sol ≈ 24 h 40 min', effect: 'Daily solar cycle', p: 1 } },
  { factor: 'Atmosphere', icon: Wind,
    moon: { value: 'Essentially none', effect: 'Extreme temperature swings', p: 3 },
    mars: { value: 'Thin, mostly carbon dioxide', effect: 'Dust storms reduce sunlight', p: 2 } },
  { factor: 'Radiation', icon: Radiation,
    moon: { value: 'No global magnetic field', effect: 'Storm shelter is critical', p: 3 },
    mars: { value: 'No global magnetic field, thin air', effect: 'Shelter still critical', p: 3 } },
  { factor: 'Resupply', icon: Package,
    moon: { value: 'Days from Earth', effect: 'Emergency reserves available', p: 1 },
    mars: { value: 'Months from Earth', effect: 'Must live off local resources', p: 3 } },
  { factor: 'Communication', icon: RadioTower,
    moon: { value: 'About 1.3 s each way', effect: 'Mission control can help', p: 1 },
    mars: { value: 'Several to ~20+ min each way', effect: 'Crew decides alone', p: 3 } },
];

const WORLDS = [
  { key: 'moon', name: 'Moon', code: 'LQ-A1 · Lunar Outpost', icon: Moon,
    chip: 'border-cyan/40 bg-cyan/10 text-cyan', rail: 'bg-cyan', tint: 'bg-cyan/[.025]', hover: 'group-hover/row:bg-cyan/[.055]' },
  { key: 'mars', name: 'Mars', code: 'LQ-M1 · Mars Outpost', icon: Globe,
    chip: 'border-[#FF9E6B]/40 bg-[#FF9E6B]/10 text-[#FF9E6B]', rail: 'bg-[#FF9E6B]', tint: 'bg-[#FF9E6B]/[.025]', hover: 'group-hover/row:bg-[#FF9E6B]/[.055]' },
] as const;

function Meter({ p, shown, delay }: { p: Pressure; shown: boolean; delay: number }) {
  const P = PRESSURE[p];
  return (
    <div className="mt-3 flex items-center gap-2.5">
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map(i => (
          <span key={i} style={{ transitionDelay: `${delay + i * 80}ms` }}
            className={cn('lq-rv h-1 w-6 origin-left rounded-full transition-transform duration-500 ease-out',
              i <= p ? P.bar : 'bg-line-strong', shown ? 'scale-x-100' : 'scale-x-0')} />
        ))}
      </span>
      <span className={cn('label text-[10px]', P.text)}>{P.label}</span>
    </div>
  );
}

function Cell({ side, world, shown, delay }: { side: Side; world: (typeof WORLDS)[number]; shown: boolean; delay: number }) {
  return (
    <td className={cn('border-t border-line-faint px-5 py-5 align-top transition-colors duration-300', world.tint, world.hover)}>
      <div style={{ transitionDelay: `${delay}ms` }}
        className={cn('lq-rv transition-[opacity,transform] duration-500 ease-out', shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
        <div className="font-medium leading-snug text-ink">{side.value}</div>
        <div className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-ink-faint">
          <ArrowRight className="mt-[3px] size-3 shrink-0" aria-hidden />
          <span>{side.effect}</span>
        </div>
        <Meter p={side.p} shown={shown} delay={delay} />
      </div>
    </td>
  );
}

export function MissionCompare() {
  const [ref, shown] = useReveal<HTMLElement>();
  return (
    <section ref={ref} aria-labelledby="cmp-h" className="mt-14 overflow-hidden rounded-2xl border border-line bg-well">
      <div className="flex flex-wrap items-end justify-between gap-4 px-7 pb-6 pt-7">
        <div>
          <SectionLabel className="mb-2.5">Mission comparison</SectionLabel>
          <h2 id="cmp-h" className="text-2xl font-semibold tracking-[-.015em]">What makes each environment different</h2>
        </div>
        <p className="max-w-[380px] text-[13px] leading-relaxed text-ink-muted">
          Physical values are approximate. Mission pressure rates gameplay difficulty in LunaQuest — it is not a physical measurement.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="label border-t border-line px-7 pb-4 pt-5 align-bottom font-medium text-ink-faint">Factor</th>
              {WORLDS.map((w, i) => (
                <th key={w.key} scope="col" className={cn('relative border-t border-line px-5 pb-4 pt-5 align-bottom', w.tint)}>
                  <span style={{ transitionDelay: `${i * 90}ms` }}
                    className={cn('lq-rv flex items-center gap-2.5 transition-[opacity,transform] duration-500 ease-out', shown ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')}>
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg border', w.chip)}><w.icon className="size-[18px]" aria-hidden /></span>
                    <span>
                      <span className="block text-[15px] font-semibold tracking-[-.01em] text-ink">{w.name}</span>
                      <span className="mt-1 block font-mono text-[10px] text-ink-faint">{w.code}</span>
                    </span>
                  </span>
                  <span aria-hidden style={{ transitionDelay: `${200 + i * 110}ms` }}
                    className={cn('lq-rv absolute inset-x-0 bottom-0 h-0.5 origin-left transition-transform duration-700 ease-out', w.rail, shown ? 'scale-x-100' : 'scale-x-0')} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => {
              const d = 120 + i * 80;
              return (
                <tr key={r.factor} className="group/row">
                  <th scope="row" className="relative border-t border-line-faint px-7 py-5 align-top font-normal">
                    <span aria-hidden className="absolute inset-y-4 left-0 w-0.5 origin-center scale-y-0 rounded-full bg-cyan transition-transform duration-300 group-hover/row:scale-y-100" />
                    <span style={{ transitionDelay: `${d}ms` }}
                      className={cn('lq-rv flex items-center gap-2.5 transition-[opacity,transform] duration-500 ease-out', shown ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0')}>
                      <r.icon className="size-4 shrink-0 text-ink-faint transition-colors duration-300 group-hover/row:text-cyan" aria-hidden />
                      <span className="font-medium text-ink-2">{r.factor}</span>
                    </span>
                  </th>
                  <Cell side={r.moon} world={WORLDS[0]} shown={shown} delay={d} />
                  <Cell side={r.mars} world={WORLDS[1]} shown={shown} delay={d + 60} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-line px-7 py-4">
        <span className="label text-[10px] text-ink-faint">Mission pressure</span>
        {([1, 2, 3] as Pressure[]).map(p => (
          <span key={p} className="flex items-center gap-2">
            <span aria-hidden className="flex gap-1">
              {[1, 2, 3].map(i => <span key={i} className={cn('h-1 w-4 rounded-full', i <= p ? PRESSURE[p].bar : 'bg-line-strong')} />)}
            </span>
            <span className={cn('text-[12px]', PRESSURE[p].text)}>{PRESSURE[p].label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
