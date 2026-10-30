'use client';

import { Minus, OctagonAlert, AlertTriangle, Wrench } from 'lucide-react';
import { SimIcon } from '@/components/lq/icons';
import { STATUS } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import { EQUIPMENT, P, nextCost, type EquipmentId, type IconName, type MissionState, type ResourceView, type Status } from '@/lib/sim';
import { cn, f0, f1, signed } from '@/lib/utils';

export type ModuleId = EquipmentId | 'hab';

const SCIENCE: Record<ModuleId, string> = {
  hab: 'The habitat always draws power for heating, cooling, air circulation and communications — even when nothing else runs.',
  solar: 'Solar output depends on sunlight. Near the lunar poles, terrain can shadow a site for days, and a full lunar night lasts about 14.5 Earth days.',
  battery: 'Batteries store surplus energy from sunny days. They make the outpost resilient, but they never create energy.',
  oxygen: 'Electrolysis splits water into hydrogen and oxygen. In this game every kilogram of oxygen costs about 1.1 L of water.',
  recycler: 'Recycling captures humidity and wastewater and purifies it. The space station’s system recovers about 98% of water; the game uses lower rates.',
  greenhouse: 'Plants need light, water and nutrients, and take time to grow. On the space station, the Veggie garden grows leafy crops under LED light.',
  shielding: 'Mass between the crew and incoming particles reduces exposure. Hydrogen-rich materials like water and plastics are effective shields.',
  reserves: 'Pre-positioned supplies buy time when a system fails.',
};

interface ModDef { id: ModuleId; label: string; icon: IconName; x: number; y: number; w: number; h: number; round?: boolean; status: Status; sub: string }

export function Schematic({ m, R, selected, onSelect, onUpgrade }: {
  m: MissionState; R: ResourceView; selected: ModuleId; onSelect: (id: ModuleId) => void; onUpgrade: (id: EquipmentId) => void;
}) {
  const L = m.levels, mods = m.mods;
  const ghDead = (mods.ghDeadUntil ?? 0) >= m.day;
  const defs: ModDef[] = [
    { id: 'solar', label: 'Solar arrays', icon: 'sun', x: 18, y: 20, w: 150, h: 84, status: R.power.sun < .5 ? 'warning' : 'stable', sub: `${f0(R.power.gen)} kWh/d` },
    { id: 'battery', label: 'Battery bank', icon: 'battery', x: 14, y: 62, w: 120, h: 84, status: R.power.status, sub: `${f0(R.power.value)} kWh` },
    { id: 'oxygen', label: 'Life support', icon: 'wind', x: 28, y: 86, w: 128, h: 76, status: R.o2.status, sub: `${f1(R.o2.production)} kg/d` },
    { id: 'hab', label: 'Habitat core', icon: 'home', x: 50, y: 50, w: 140, h: 140, round: true, status: R.crew.status, sub: '4 crew' },
    { id: 'shielding', label: 'Storm shelter', icon: 'shield', x: 76, y: 20, w: 128, h: 80, status: R.radiation.status, sub: `Level ${L.shielding}` },
    { id: 'greenhouse', label: 'Greenhouse', icon: 'sprout', x: 84, y: 54, w: 128, h: 84, status: ghDead ? 'critical' : R.food.status, sub: R.food.production ? `${f1(R.food.production)} kg/d` : 'Growing' },
    { id: 'recycler', label: 'Water recycler', icon: 'droplets', x: 72, y: 86, w: 136, h: 76, status: R.water.recOn ? R.water.status : 'critical', sub: R.water.recOn ? `${Math.round(R.water.recycling * 100)}%` : 'Offline' },
  ];
  const installed = (id: ModuleId) => id === 'hab' || id === 'battery' || L[id] > 0;

  // inspector
  const sel = defs.find(d => d.id === selected)!;
  const e = selected === 'hab' ? null : EQUIPMENT.find(x => x.id === selected)!;
  const inst = installed(selected);
  const offline = (selected === 'recycler' && !R.water.recOn) || (selected === 'greenhouse' && ghDead);
  const degraded = (selected === 'solar' && (mods.solarDerateUntil ?? 0) >= m.day) || (selected === 'greenhouse' && (mods.ghReducedUntil ?? 0) >= m.day);
  const cond = !inst ? { label: 'Not installed', cls: 'text-ink-faint', Icon: Minus }
    : offline ? { label: 'Offline', cls: 'text-critical', Icon: OctagonAlert }
    : degraded ? { label: 'Degraded', cls: 'text-warning', Icon: AlertTriangle }
    : { label: STATUS[sel.status].label, cls: STATUS[sel.status].text, Icon: STATUS[sel.status].icon };
  const rows: Record<ModuleId, [string, string][]> = {
    hab: [['Crew aboard', '4'], ['Base power load', `${P.baseLoad} kWh/day`], ['Crew health', `${Math.round(m.health)} / 100`]],
    solar: [['Output now', `${f0(R.power.gen)} kWh/day`], ['Peak output', `${P.solarPerLevel * L.solar} kWh/day`], ['Sunlight', `${Math.round(R.power.sun * 100)}%`], ['Operating cost', 'None']],
    battery: [['Charge', `${f0(R.power.value)} / ${R.power.cap} kWh`], ['Net flow', `${signed(R.power.net)} kWh/day`], ['Operating cost', 'None']],
    oxygen: [['Generation', `${f1(R.o2.production)} kg/day`], ['Crew demand', `${f1(R.o2.consumption)} kg/day`], ['Operating cost', `${P.o2Load * L.oxygen} kWh + ${f1(R.o2.production * P.electrolysis)} L/day`]],
    recycler: [['Recovery rate', `${Math.round(R.water.recycling * 100)}%`], ['Status', R.water.recOn ? 'Online' : 'Offline'], ['Operating cost', `${P.recLoad * L.recycler} kWh/day`]],
    greenhouse: [['Production', `${f1(R.food.production)} kg/day`], ['First harvest', `Day ${mods.ghMatureDay ?? P.ghMature}`], ['Operating cost', `${P.ghLoad * L.greenhouse} kWh + ${P.ghWater * L.greenhouse} L/day`]],
    shielding: [['Rating', R.radiation.tier], ['Space weather', R.radiation.risk], ['Operating cost', 'None']],
    reserves: [],
  };
  const nc = e ? nextCost(e.id, L[e.id]) : null;

  return (
    <section aria-labelledby="hab-h" className="overflow-hidden rounded-[14px] border border-line-soft bg-well">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line-soft px-4 py-3">
        <h2 id="hab-h" className="label text-ink-2">Outpost schematic</h2>
        <span className="text-xs text-ink-faint">Select a system to inspect it</span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 text-xs text-ink-muted"><SimIcon name="sun" className="size-3.5" />Sunlight {Math.round(R.power.sun * 100)}%</span>
      </div>
      <div className="flex flex-wrap">
        <div className="bg-grid relative min-h-[460px] min-w-0 flex-[3_1_420px]">
          <svg aria-hidden className="absolute inset-0 size-full">
            {defs.filter(d => d.id !== 'hab').map(d => (
              <line key={d.id} x1="50%" y1="50%" x2={`${d.x}%`} y2={`${d.y}%`} stroke={installed(d.id) ? '#1F3550' : '#172235'} strokeWidth={2} strokeDasharray={installed(d.id) ? undefined : '4 6'} />
            ))}
          </svg>
          {defs.map(d => {
            const on = selected === d.id, inst = installed(d.id), S = STATUS[d.status];
            return (
              <button key={d.id} onClick={() => onSelect(d.id)} aria-pressed={on} aria-label={`${d.label}${inst ? '' : ', not installed'}`}
                style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.w, height: d.h }}
                className={cn('absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 border-[1.5px] transition-[border-color,box-shadow,background] hover:border-cyan hover:bg-[#10202E]',
                  d.round ? 'rounded-full' : 'rounded-[10px]',
                  on ? 'border-cyan bg-[#0F2233] shadow-[0_0_0_4px_rgba(93,225,255,.12)]' : inst ? (d.status === 'stable' ? 'border-[#2E4560] bg-[#0D1726]' : cn(S.border, 'bg-[#0D1726]')) : 'border-dashed border-line-strong bg-surface/50',
                  inst ? 'text-ink' : 'text-ink-faint')}>
                <SimIcon name={d.icon} className="size-5" />
                <span className="text-center text-[11.5px] font-medium leading-tight">{d.label}</span>
                <span className={cn('flex items-center gap-1 font-mono text-[10px]', inst ? S.text : 'text-ink-faint')}>
                  <span className={cn('size-1.5 rounded-full', inst ? S.fill : 'bg-ink-faint')} />{inst ? d.sub : 'Not installed'}
                </span>
              </button>
            );
          })}
        </div>

        <aside aria-live="polite" aria-label="System inspection" className="flex min-w-0 flex-[2_1_280px] flex-col border-l border-line-soft bg-surface">
          <div className="flex items-center gap-3 border-b border-line-soft px-4 py-4">
            <span className="grid size-10 place-items-center rounded-[10px] border border-cyan/30 bg-cyan/[.08] text-cyan"><SimIcon name={sel.icon} className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="label mb-1 text-[10px] text-ink-faint">{e ? `Level ${L[e.id]} of ${e.max}` : 'Pressurized module'}</div>
              <div className="text-base font-semibold">{e ? e.name : 'Habitat Core'}</div>
            </div>
            <span className={cn('flex items-center gap-1.5 text-xs font-medium', cond.cls)}><cond.Icon className="size-3.5" />{cond.label}</span>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-line-soft px-4 py-3 text-[13px]">
            {(inst ? rows[selected] : [['Status', 'Not installed'], ['Install cost', `${nc} credits`]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-ink-muted">{k}</dt><dd className="tnum text-right">{v}</dd></div>
            ))}
          </dl>
          <div className="border-b border-line-soft px-4 py-3.5">
            <div className="label mb-2 text-[10px] text-cyan">The science</div>
            <p className="text-[13px] leading-relaxed text-ink-2">{SCIENCE[selected]}</p>
          </div>
          <div className="mt-auto flex items-center gap-2.5 px-4 py-3.5">
            <span className="flex-1 text-[12.5px] text-ink-muted">
              {!e ? 'The habitat cannot be upgraded in this mission.' : nc === null ? 'Fully upgraded.' : `Next level: ${nc} credits · you have ${m.credits}`}
            </span>
            {e && nc !== null && <Button variant="outline" size="sm" onClick={() => onUpgrade(e.id)}><Wrench />Upgrade options</Button>}
          </div>
        </aside>
      </div>
    </section>
  );
}
