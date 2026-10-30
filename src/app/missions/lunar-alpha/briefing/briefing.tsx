'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Battery, BookOpen, ChevronDown, Droplets, FlaskConical, Moon, Shield,
  Sprout, Sun, Thermometer, Wind, Wrench, Zap,
} from 'lucide-react';
import { SetupHeader } from '@/components/lq/setup-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/primitives';
import { CREW_MANIFEST, SIM_RULES } from '@/lib/sim';
import { cn } from '@/lib/utils';

const OBJECTIVES: [string, React.ElementType][] = [
  ['Maintain essential life-support systems.', Wind],
  ['Keep water and food reserves above critical levels.', Droplets],
  ['Maintain sufficient power for critical equipment.', Zap],
  ['Manage radiation exposure risk.', Shield],
  ['Complete at least three science objectives.', FlaskConical],
];
const CHALLENGES: [React.ElementType, string, string][] = [
  [Sun, 'Solar particle events', 'Forecast storms will require sheltering the crew.'],
  [Moon, 'Terrain shadowing', 'Around days 11–16, sunlight at the site drops to about 30%.'],
  [Thermometer, 'Thermal extremes', 'The habitat always draws power for heating and cooling.'],
  [Wrench, 'Equipment faults', 'Some failures will arrive without warning.'],
];
const SUPPLIES: [React.ElementType, string, string, string, string][] = [
  [Wind, 'Oxygen', '60', 'kg', '≈ 18 days without generation'],
  [Droplets, 'Water', '300', 'L', '12 L used per day'],
  [Sprout, 'Food', '180', 'kg', '≈ 25 days of packaged meals'],
  [Battery, 'Habitat battery', '20', 'kWh', 'Expandable with storage'],
];
const CHECKS = [
  'I understand resources are finite and drain every day.',
  'I understand life support depends on reliable power.',
  'I will plan for solar storms and shelter my crew.',
  'I know these rules are simplified for learning.',
];

function Panel({ title, id, children, className }: { title: string; id: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('rounded-[14px] border border-line bg-surface', className)}>
      <h2 id={id} className="label border-b border-line px-5 py-4">{title}</h2>
      {children}
    </section>
  );
}

export function Briefing() {
  const router = useRouter();
  const [checks, setChecks] = useState([false, false, false, false]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const n = checks.filter(Boolean).length;
  const ready = n === 4;

  const reviewData = () => {
    setRulesOpen(true);
    const el = document.getElementById('data');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  };

  return (
    <>
      <SetupHeader step={1} back={{ href: '/missions', label: 'Missions' }} />
      <main className="mx-auto max-w-[1360px] px-5 pb-28 pt-[clamp(32px,5vw,56px)] md:px-12">
        <Link href="/missions" className="mb-7 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted"><ArrowLeft className="size-4" />Back to missions</Link>

        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7">
          <div>
            <div className="label mb-4 flex flex-wrap gap-x-4 gap-y-2"><span className="text-cyan">Mission briefing</span><span>ID LQ-A1-2026</span><span>Destination · Lunar south polar ridge</span></div>
            <h1 className="text-[clamp(36px,5vw,64px)] font-semibold leading-[.98] tracking-[-.035em]">LUNAR OUTPOST — ALPHA</h1>
            <p className="mt-4 max-w-[640px] text-lg leading-relaxed text-ink-2">Maintain a four-person crew for 30 simulated days while completing scientific objectives.</p>
          </div>
          <dl className="flex gap-px overflow-hidden rounded-xl border border-line bg-line">
            {[['Duration', '30', ' days'], ['Crew', '4', ''], ['Budget', '100', ' cr']].map(([k, v, u]) => (
              <div key={k} className="bg-surface px-4 py-3.5"><dt className="mb-1.5 text-xs text-ink-muted">{k}</dt><dd className="tnum text-[22px] font-semibold">{v}<span className="text-[13px] font-normal text-ink-muted">{u}</span></dd></div>
            ))}
          </dl>
        </div>

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
            <Panel title="Primary objectives" id="obj-h">
              <ol className="px-5 pb-2.5 pt-1.5">
                {OBJECTIVES.map(([t, I], i) => (
                  <li key={t} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-line-faint py-3.5 last:border-0">
                    <span className="font-mono text-xs text-cyan">{String(i + 1).padStart(2, '0')}</span><span className="leading-snug">{t}</span><I className="size-[18px] text-ink-muted" />
                  </li>
                ))}
              </ol>
            </Panel>

            <div className="grid gap-5 sm:grid-cols-2">
              <Panel title="Crew manifest" id="crew-h">
                <ul className="px-5 pb-3.5 pt-2">
                  {CREW_MANIFEST.map(c => (
                    <li key={c.code} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-9 place-items-center rounded-full border border-line bg-elevated font-mono text-[11px] text-cyan">{c.code}</span>
                      <span><span className="block font-medium">{c.name}</span><span className="text-[13px] text-ink-muted">{c.role}</span></span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Expected challenges" id="env-h">
                <ul className="px-5 pb-3.5 pt-2">
                  {CHALLENGES.map(([I, t, d]) => (
                    <li key={t} className="flex items-start gap-3 py-2.5"><I className="mt-0.5 size-[18px] text-warning" /><span><span className="block font-medium">{t}</span><span className="text-[13px] leading-normal text-ink-muted">{d}</span></span></li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Panel title="Starting supplies & equipment" id="data-h">
              <div id="data" className="grid grid-cols-2 gap-px bg-line-faint md:grid-cols-4">
                {SUPPLIES.map(([I, k, v, u, note]) => (
                  <div key={k} className="bg-surface px-5 py-4">
                    <div className="mb-2 flex items-center gap-2 text-[13px] text-ink-muted"><I className="size-4" />{k}</div>
                    <div className="tnum text-2xl font-semibold">{v}<span className="text-[13px] font-normal text-ink-muted"> {u}</span></div>
                    <div className="mt-1 text-xs text-ink-faint">{note}</div>
                  </div>
                ))}
              </div>
              <p className="border-t border-line-faint px-5 py-4 text-sm leading-relaxed text-ink-2">Included: pressurized habitat module with basic thermal control and communications (14 kWh/day). Everything else — power, recycling, oxygen, food production, shielding — must be bought with your 100 credits.</p>
            </Panel>

            <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="rounded-[14px] border border-line bg-surface">
              <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <BookOpen className="size-[18px] text-cyan" />
                <span className="flex-1"><span className="block font-semibold">Simulation assumptions &amp; simplified rules</span><span className="text-[13px] text-ink-muted">How the game calculates what happens each day</span></span>
                <ChevronDown className={cn('size-[18px] text-ink-muted transition-transform', rulesOpen && 'rotate-180')} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-x-7 px-5 pb-5 md:grid-cols-2">
                  {SIM_RULES.map((r, i) => (
                    <div key={r} className="flex gap-2.5 border-t border-line-faint py-2.5 text-sm leading-relaxed text-ink-2"><span className="font-mono text-xs leading-7 text-cyan">R{i + 1}</span><span>{r}</span></div>
                  ))}
                </div>
                <p className="flex gap-2.5 border-t border-line-faint px-5 pb-5 pt-3.5 text-[13px] text-warning"><AlertTriangle className="size-4 shrink-0" />These are illustrative game parameters. They are not suitable for designing real spacecraft or protecting real astronauts.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <aside aria-labelledby="ready-h" className="overflow-hidden rounded-[14px] border border-line bg-surface lg:sticky lg:top-[88px]">
            <div className="border-b border-line px-5 py-5">
              <h2 id="ready-h" className="label mb-3.5">Mission readiness</h2>
              <div className="flex items-baseline gap-2"><span className="tnum text-[40px] font-semibold tracking-[-.02em]">{n}</span><span className="text-ink-muted">/ 4 confirmed</span></div>
              <Progress value={n * 25} className="mt-3" aria-label="Readiness" />
            </div>
            <ul className="px-3 py-2.5">
              {CHECKS.map((t, i) => (
                <li key={t}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 text-sm leading-snug hover:bg-elevated">
                    <Checkbox checked={checks[i]} onCheckedChange={v => setChecks(c => c.map((x, j) => (j === i ? v === true : x)))} className="mt-px" />
                    <span>{t}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5 border-t border-line px-5 pb-5 pt-4">
              <Button size="lg" disabled={!ready} onClick={() => router.push('/missions/lunar-alpha/configure')}>CONFIGURE YOUR OUTPOST <ArrowRight /></Button>
              <Button variant="secondary" onClick={reviewData}>REVIEW MISSION DATA</Button>
              <p className="text-center text-xs text-ink-faint">{ready ? 'Ready. You have 100 credits to spend.' : 'Confirm all four items to continue.'}</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
