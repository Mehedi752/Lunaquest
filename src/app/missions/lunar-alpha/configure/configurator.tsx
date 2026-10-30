'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { AlertTriangle, Check, CheckCircle2, Info, Layers, Minus, Moon, OctagonAlert, Plus, RotateCcw, Rocket, Shield, Sun, Wind, Droplets } from 'lucide-react';
import { SetupHeader } from '@/components/lq/setup-header';
import { SimIcon } from '@/components/lq/icons';
import { SectionLabel } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useHydrated, useMissionStore } from '@/lib/store';
import {
  SCENARIOS, EQUIPMENT, P, PRESETS, batteryCap, configCost, emptyLevels, newMission, nextCost, project, resources,
  type EquipmentId, type Levels, type ScenarioId,
} from '@/lib/sim';
import { cn } from '@/lib/utils';
import { SEGMENT_COLORS } from '@/lib/sim/colors';


type Tone = 'ok' | 'warn' | 'bad';
const TONE_UI: Record<Tone, { cls: string; Icon: React.ElementType }> = {
  ok: { cls: 'text-success', Icon: CheckCircle2 }, warn: { cls: 'text-warning', Icon: AlertTriangle }, bad: { cls: 'text-critical', Icon: OctagonAlert },
};

export function Configurator() {
  const router = useRouter();
  const hydrated = useHydrated();
  const levels = useMissionStore(s => s.config);
  const setConfig = useMissionStore(s => s.setConfig);
  const deploy = useMissionStore(s => s.deploy);
  const scenario = useMissionStore(s => s.scenario);
  const setScenario = useMissionStore(s => s.setScenario);
  const loadSW = useMissionStore(s => s.loadSpaceWeather);
  const SC = SCENARIOS[scenario];
  const BUDGET = SC.budget;
  useEffect(() => { loadSW(); }, [loadSW]);

  const spent = configCost(levels);
  const remaining = BUDGET - spent;

  const { caps, projection } = useMemo(() => capabilities(levels, scenario), [levels, scenario]);
  const setLevel = (id: EquipmentId, v: number) => setConfig({ ...levels, [id]: v });

  return (
    <>
      <SetupHeader step={2} back={{ href: '/missions/lunar-alpha/briefing', label: 'Briefing' }} />
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-[clamp(28px,4vw,48px)] md:px-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <SectionLabel className="mb-3.5">Initial outpost configuration</SectionLabel>
            <h1 className="text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.02] tracking-[-.03em]">Spend {BUDGET} credits. Keep four people alive.</h1>
            <p className="mt-3 max-w-[620px] leading-relaxed text-ink-muted">{BUDGET >= 105 ? 'Level 1 of every system costs 105 credits, so you can afford it — but surviving this scenario needs upgrades.' : 'You can’t afford everything. A level-1 version of every system costs 105 credits — choose what to skip, or what to double up on.'} {SC.lesson}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setConfig({ ...PRESETS.balanced })}><Layers />Load suggested setup</Button>
        </div>

        <section aria-labelledby="sc-h" className="mb-8">
          <h2 id="sc-h" className="label mb-3 text-cyan">Step 1 · Choose a scenario</h2>
          <div role="radiogroup" aria-labelledby="sc-h" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Object.values(SCENARIOS).map(s => { const on = s.id === scenario; return (
              <button key={s.id} role="radio" aria-checked={on} onClick={() => setScenario(s.id)}
                className={cn('flex flex-col gap-2 rounded-[14px] border-[1.5px] p-4 text-left transition-colors hover:border-cyan', on ? 'border-cyan bg-gradient-to-b from-[#0F1C2B] to-surface' : 'border-line bg-surface')}>
                <span className="flex w-full justify-between gap-2"><span className={cn('label', s.difficulty === 'Hard' ? 'text-critical-soft' : s.difficulty === 'Explorer' ? 'text-success' : 'text-warning')}>{s.difficulty}</span><span className="font-mono text-[11px] text-ink-muted">{s.days} days · {s.budget} cr</span></span>
                <span className="text-lg font-semibold">{s.name}</span>
                <span className="text-[13px] leading-relaxed text-ink-2">{s.goal}</span>
              </button>); })}
          </div>
        </section>

        <div className={cn('grid items-start gap-6 lg:grid-cols-3', !hydrated && 'opacity-60')}>
          <section aria-label="Equipment" className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-2">
            {EQUIPMENT.map(e => {
              const lvl = levels[e.id], cost = nextCost(e.id, lvl), maxed = cost === null, afford = !maxed && cost <= remaining, active = lvl > 0;
              return (
                <article key={e.id} aria-labelledby={`eq-${e.id}`}
                  className={cn('flex flex-col rounded-[14px] border transition-colors', active ? 'border-[#2F5A73] bg-gradient-to-b from-[#0F1C2B] to-surface' : 'border-line bg-surface')}>
                  <div className="flex items-start gap-3.5 px-5 pt-5">
                    <span className={cn('grid size-11 shrink-0 place-items-center rounded-[11px] border', active ? 'border-cyan/35 bg-cyan/10 text-cyan' : 'border-line bg-elevated text-ink-muted')}>
                      <SimIcon name={e.icon} className="size-[22px]" />
                    </span>
                    <div className="min-w-0 flex-1"><div className="label mb-1.5 text-[10px] text-ink-faint">{e.category}</div><h2 id={`eq-${e.id}`} className="text-[17px] font-semibold">{e.name}</h2></div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button aria-label={`Why ${e.name} matters`} className="grid size-[30px] place-items-center rounded-lg border border-line text-ink-muted hover:border-[#3A4E6B] hover:text-cyan"><Info className="size-[15px]" /></button>
                      </TooltipTrigger>
                      <TooltipContent>{e.tip}</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mx-5 mt-3 text-sm leading-normal text-ink-2">{e.purpose}</p>
                  <div className="mx-5 mt-3.5 flex flex-col gap-2 rounded-[10px] border border-line-faint bg-well p-3 text-[13px]">
                    <div className="flex items-center justify-between"><span className="text-xs text-ink-muted">Level</span>
                      <span aria-label={`Level ${lvl} of ${e.max}`} className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className={cn('h-1.5 w-[18px] rounded-sm', i < lvl ? 'bg-cyan' : 'bg-line')} />)}</span>
                    </div>
                    <div className="flex justify-between gap-2"><span className="text-ink-muted">Now</span><span className="tnum text-right">{lvl ? e.effect(lvl) : e.id === 'battery' ? '20 kWh (habitat only)' : 'Not installed'}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-ink-muted">Next</span><span className="tnum text-right text-cyan">{maxed ? 'Maximum level' : e.effect(lvl + 1)}</span></div>
                  </div>
                  <p className="mx-5 mt-3 flex gap-2 text-[12.5px] leading-normal text-[#C9B48D]"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />{e.tradeoff}</p>
                  <div className="mt-auto flex items-center gap-2.5 px-5 pb-5 pt-4">
                    <div className="min-w-0 flex-1">
                      <div className="tnum text-xl font-semibold">{maxed ? 'Max' : `${cost} cr`}</div>
                      <div className={cn('text-xs', !maxed && !afford ? 'text-critical' : 'text-ink-muted')}>
                        {maxed ? 'Fully upgraded' : afford ? (lvl ? `Upgrade to level ${lvl + 1}` : 'Not yet purchased') : `Need ${cost - remaining} more credits`}
                      </div>
                    </div>
                    <Button variant="secondary" size="icon" className="size-10" disabled={!lvl} aria-label={`Remove one level of ${e.name}`} onClick={() => setLevel(e.id, lvl - 1)}><Minus /></Button>
                    <Button size="sm" className="h-10" disabled={!afford} aria-label={`${lvl ? 'Upgrade' : 'Add'} ${e.name}`} onClick={() => setLevel(e.id, lvl + 1)}>
                      {maxed ? <Check /> : <Plus />}{maxed ? 'Max' : lvl ? 'Upgrade' : 'Add'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside aria-label="Budget and capabilities" className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
            <section className="overflow-hidden rounded-[14px] border border-line bg-surface">
              <div className="px-5 pb-4 pt-5">
                <div className="label mb-3.5">Construction budget</div>
                <div aria-live="polite" className="flex items-baseline gap-2">
                  <span className={cn('tnum text-5xl font-semibold tracking-[-.03em]', remaining < 10 ? 'text-warning' : 'text-ink')}>{remaining}</span>
                  <span className="text-ink-muted">credits remaining</span>
                </div>
                <div role="img" aria-label={`Budget allocation: ${spent} of 100 credits committed`} className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded bg-line-faint">
                  {EQUIPMENT.filter(e => levels[e.id]).map(e => {
                    const c = e.costs.slice(0, levels[e.id]).reduce((a, b) => a + b, 0);
                    return <span key={e.id} title={`${e.name}: ${c} credits`} className="transition-[width] duration-300" style={{ width: `${c}%`, background: SEGMENT_COLORS[e.id] }} />;
                  })}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-ink-muted">
                  {[['Available', BUDGET], ['Committed', spent], ['Remaining', remaining]].map(([k, v]) => <div key={k}>{k}<div className="tnum mt-0.5 text-base text-ink">{v}</div></div>)}
                </div>
              </div>
              <ul className="border-t border-line-faint px-5 pb-3.5 pt-2">
                {spent === 0 && <li className="py-3 text-[13px] text-ink-faint">No equipment selected yet. Add systems from the left.</li>}
                {EQUIPMENT.filter(e => levels[e.id]).map(e => (
                  <li key={e.id} className="flex items-center gap-2.5 py-2 text-[13px]">
                    <span className="size-2 rounded-sm" style={{ background: SEGMENT_COLORS[e.id] }} />
                    <span className="flex-1">{e.name} <span className="text-ink-faint">L{levels[e.id]}</span></span>
                    <span className="tnum text-ink-2">{e.costs.slice(0, levels[e.id]).reduce((a, b) => a + b, 0)} cr</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="cap-h" className="rounded-[14px] border border-line bg-surface">
              <div className="flex items-center justify-between px-5 pb-1.5 pt-4"><h2 id="cap-h" className="label">Expected capabilities</h2><span className="text-[11px] text-ink-faint">If no emergencies occur</span></div>
              <ul className="px-5 pb-3">
                {caps.map(c => { const T = TONE_UI[c.tone]; return (
                  <li key={c.k} className="flex items-center gap-2.5 border-b border-line-faint py-2.5 text-[13px]">
                    <c.icon className="size-4 text-ink-muted" /><span className="flex-1 text-ink-2">{c.k}</span>
                    <span className={cn('tnum flex items-center gap-1.5 text-right font-medium', T.cls)}><T.Icon className="size-3.5" />{c.v}</span>
                  </li>
                ); })}
              </ul>
              <div className={cn('mx-5 mb-4 flex gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px] leading-normal text-[#DCE4EF]',
                projection.ok ? 'border-success/30 bg-success/[.08]' : 'border-critical/35 bg-critical/[.08]')}>
                {projection.ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <AlertTriangle className="size-4 shrink-0 text-critical" />}
                <span>{projection.text}</span>
              </div>
            </section>

            <Button size="lg" className="h-[54px]" disabled={spent === 0} onClick={() => { deploy(); router.push('/mission'); }}><Rocket />DEPLOY OUTPOST</Button>
            <Button variant="secondary" onClick={() => setConfig(emptyLevels())}><RotateCcw />RESET CONFIGURATION</Button>
            <p className="text-center text-xs text-ink-faint">All costs and capacities are illustrative game parameters.</p>
          </aside>
        </div>
      </main>
    </>
  );
}

function capabilities(L: Levels, scenario: ScenarioId) {
  const base = newMission(L, { scenario }), R = resources(base);
  const { final, firstShortfall } = project(L, scenario);
  const shadowGen = P.solarPerLevel * L.solar * .3;
  const days = (v: number, net: number) => (net >= 0 ? 99 : v / -net);
  const fmt = (v: number, net: number) => (net >= 0 ? 'Sustained' : `${Math.floor(v / -net)} days`);
  const t = (ok: boolean, warn: boolean): Tone => (ok ? 'ok' : warn ? 'warn' : 'bad');
  const o2d = days(R.o2.value, R.o2.net), wd = days(R.water.value, R.water.net);
  const caps = [
    { icon: Wind, k: 'Oxygen supply', v: fmt(R.o2.value, R.o2.net), tone: t(o2d >= 30, o2d >= 20) },
    { icon: Droplets, k: 'Water supply', v: fmt(R.water.value, R.water.net), tone: t(wd >= 40, wd >= 30) },
    { icon: Sun, k: 'Power at full sun', v: `${R.power.gen >= R.power.load ? '+' : ''}${Math.round(R.power.gen - R.power.load)} kWh/day`, tone: t(R.power.gen >= R.power.load, R.power.gen > 0) },
    { icon: Moon, k: 'Power in shadow', v: `${Math.round(shadowGen - R.power.load)} kWh/day`, tone: t(shadowGen >= R.power.load, batteryCap(base) >= 80) },
    { icon: Shield, k: 'Storm protection', v: EQUIPMENT[2].effect(L.shielding), tone: t(L.shielding >= 2, L.shielding >= 1) },
  ];
  const ok = final.status === 'complete';
  const text = ok
    ? final.food < 20 || final.water < 40
      ? `Survives ${final.days ?? 30} days with thin margins (food ${Math.round(final.food)} kg, water ${Math.round(final.water)} L). Emergencies will test this.`
      : 'Projected to complete ${final.days ?? 30} days if no emergencies occur. Emergencies will still test this setup.'
    : `Projected failure on day ${final.day}: ${final.failure?.system.toLowerCase() ?? 'reserves'} runs out${firstShortfall ? `; power shortfalls begin on day ${firstShortfall}` : ''}.`;
  return { caps, projection: { ok, text } };
}
