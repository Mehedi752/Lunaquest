'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, Award, Battery, CheckCircle2, Clock, Droplets, FlaskConical, Info, OctagonAlert, Pause, Play,
  Shield, Sprout, Sun, Users, Wind, Wrench, type LucideIcon,
} from 'lucide-react';
import { Emblem } from '@/components/lq/icons';
import { DayByDay } from '@/components/lq/day-by-day';
import { Flow, Sky } from './canvas';
import { useMissionStore } from '@/lib/store';
import { CAPS, P, SCENARIOS, SUN, autoplay, type ScenarioId, type SpaceWeather } from '@/lib/sim';
import { cn } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');
const H2 = 'text-balance text-[clamp(32px,4vw,54px)] font-semibold leading-[1.02] tracking-[-.03em]';
const KICK = 'mb-4 font-mono text-xs font-medium uppercase tracking-[.16em] text-[#5DE1FF]';
const MONO = 'font-mono text-[10.5px] font-medium uppercase tracking-[.14em]';
const BTN = 'inline-flex items-center gap-2.5 rounded-[10px] font-semibold tracking-[.06em] transition-colors';
const useVW = () => { const [w, setW] = useState(1440); useEffect(() => { const f = () => setW(window.innerWidth); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []); return w; };
const useReduce = () => { const [r, setR] = useState(false); useEffect(() => setR(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches), []); return r; };

/* ---------------------------------------------------------------- nav */
function TopStrip({ vw }: { vw: number }) {
  return (
    <div className={cn('fixed inset-x-0 top-0 z-[51] flex h-[30px] items-center gap-[22px] overflow-hidden whitespace-nowrap border-b border-[#121B2A] bg-[#020409] px-[clamp(20px,4vw,56px)] text-[#91A0B7]', MONO)}>
      <span className="text-[#5DE1FF]">NASA Space Apps Challenge 2026</span>
      {vw >= 1100 && <span>Challenge · Build a Junior Astronaut Mission Trainer</span>}
    </div>
  );
}
function Nav({ vw }: { vw: number }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 40); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const links: [string, string, boolean][] = [['#daybyday', 'How It Works', vw >= 1180], ['#systems', 'Systems', vw >= 980], ['#scenarios', 'Scenarios', vw >= 980], ['/science', 'Science Lab', vw >= 760], ['#science', 'Data & Sources', vw >= 1180]];
  return (
    <nav aria-label="Primary" className={cn('fixed inset-x-0 top-[30px] z-50 flex h-16 items-center gap-7 border-b px-[clamp(20px,4vw,56px)] backdrop-blur-[14px] transition-colors', scrolled ? 'border-[#121B2A] bg-[rgba(5,8,15,.88)]' : 'border-transparent bg-transparent')}>
      <a href="#top" className="flex items-center gap-2.5 text-[#F3F7FC]">
        <Emblem size={30} />
        <span className="flex flex-col gap-0.5"><span className="text-[17px] font-semibold leading-none tracking-[-.01em]">LunaQuest</span><span className="font-mono text-[9.5px] font-medium tracking-[.16em] text-[#91A0B7]">MISSION SIMULATOR</span></span>
      </a>
      <div className="flex min-w-0 flex-1 justify-center gap-[26px] overflow-hidden whitespace-nowrap text-sm">
        {links.filter(l => l[2]).map(([href, label]) => <a key={label} href={href} className="text-[#C4CEDD] hover:text-[#F3F7FC]">{label}</a>)}
      </div>
      <Link href="/missions" className={cn(BTN, 'h-10 bg-[#5DE1FF] px-[18px] text-[13px] tracking-[.05em] text-[#04111A] hover:bg-[#8BEBFF]')}>BEGIN MISSION <ArrowRight className="size-[15px]" /></Link>
    </nav>
  );
}

/* ---------------------------------------------------------------- hero */
function LiveConsole({ align }: { align: 'end' | 'center' }) {
  const run = useMemo(() => autoplay('success', 'outpost'), []);
  const reduce = useReduce();
  const [i, setI] = useState(0), [paused, setPaused] = useState(false);
  useEffect(() => { if (reduce) { setI(12); return; } const t = setInterval(() => { if (!paused && !document.hidden) setI(x => (x + 1) % (run.history.length + 3)); }, 1100); return () => clearInterval(t); }, [paused, reduce, run.history.length]);
  const H = run.history, idx = Math.min(i, H.length - 1), h = H[idx];
  const tone = (p: number) => (p < 10 ? '#FF6B78' : p < 25 ? '#FFC66D' : '#57D9A3');
  const pct = (v: number, c: number) => Math.max(0, Math.min(100, (v / c) * 100));
  const gauges = ([['Oxygen', h.o2, CAPS.o2, 'kg'], ['Water', h.water, CAPS.water, 'L'], ['Food', h.food, CAPS.food, 'kg'], ['Battery', h.battery, h.batteryCap, 'kWh']] as const)
    .map(([name, v, c, u]) => ({ name, value: `${Math.round(v)} ${u}`, p: pct(v, c) }));
  const X = (d: number) => ((d - 1) / 29) * 300, Y = (v: number) => 54 - v * 50;
  const pts = H.slice(0, idx + 1).map(x => [X(x.day), Y(x.battery / x.batteryCap)]), last = pts[pts.length - 1] ?? [0, 54];
  const COL: Record<string, string> = { event: '#FF8A94', alert: '#FFC66D', objective: '#57D9A3', decision: '#C4CEDD' };
  const evs = run.log.filter(l => l.day <= h.day && ['event', 'objective', 'decision', 'alert'].includes(l.type) && !/deployed/.test(l.text)).slice(-3).reverse();
  const events = (evs.length ? evs : [{ day: 1, type: 'decision', text: 'Outpost deployed. Crew of four aboard.' }]);
  return (
    <aside aria-label="Live simulation preview" className={cn('w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#243247] bg-[rgba(8,13,23,.86)] shadow-[0_40px_120px_-40px_rgba(0,0,0,.9)] backdrop-blur-[14px]', align === 'end' ? 'justify-self-end' : 'justify-self-center')}>
      <div className="flex items-center gap-2.5 border-b border-[#1B273A] px-4 py-3">
        <span className={cn(MONO, 'text-[#C4CEDD]')}>LQ-A1 · Simulation preview</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[.12em] text-[#57D9A3]"><span className={cn('size-1.5 rounded-full bg-[#57D9A3]', !paused && !reduce && 'animate-pulse')} />REAL ENGINE</span>
        <div className="flex-1" />
        <button onClick={() => setPaused(p => !p)} aria-pressed={paused} aria-label={paused ? 'Resume simulation preview' : 'Pause simulation preview'} className="grid size-[30px] place-items-center rounded-[7px] border border-[#2E3F58] text-[#C4CEDD] hover:border-[#5DE1FF]">{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button>
      </div>
      <div className="flex items-end justify-between gap-3 px-4 pb-2 pt-4">
        <div><div className="mb-1.5 font-mono text-[10px] tracking-[.14em] text-[#6F7D93]">MISSION DAY</div><div className="tnum text-[40px] font-semibold leading-none tracking-[-.02em]">{pad(h.day)}<span className="text-base font-normal text-[#6F7D93]"> / 30</span></div></div>
        <div className="text-right"><div className="mb-1.5 font-mono text-[10px] tracking-[.14em] text-[#6F7D93]">SUNLIGHT</div><div className={cn('tnum text-xl font-semibold', h.sun < .5 ? 'text-[#FFC66D]' : 'text-[#F3F7FC]')}>{Math.round(h.sun * 100)}%</div></div>
      </div>
      <div className="px-4"><div className="h-1 overflow-hidden rounded-full bg-[#172235]"><div className="h-full bg-[#5DE1FF] transition-[width] duration-[900ms] ease-out" style={{ width: `${(h.day / 30) * 100}%` }} /></div></div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 pb-1 pt-3">
        {gauges.map(g => (
          <li key={g.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2"><span className={cn(MONO, 'tracking-[.12em] text-[#91A0B7]')}>{g.name}</span><span className="tnum text-[13px] font-semibold">{g.value}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#172235]"><div className="h-full rounded-full transition-[width,background-color] duration-[900ms] ease-out" style={{ width: `${g.p}%`, background: tone(g.p) }} /></div>
          </li>))}
      </ul>
      <figure className="mx-4 mt-2 rounded-[10px] border border-[#172235] bg-[#060A13] px-3 py-2.5">
        <figcaption className="mb-1.5 flex justify-between font-mono text-[10px] tracking-[.12em] text-[#6F7D93]"><span>BATTERY · % OF CAPACITY</span><span className="text-[#FFC66D]">▒ SHADOW D11–16</span></figcaption>
        <svg viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Battery charge trend" className="block h-[60px] w-full">
          <rect x="100" y="0" width="60" height="60" fill="rgba(255,198,109,.08)" />
          <line x1="0" y1="54" x2="300" y2="54" stroke="#1B273A" />
          <path d={pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke="#5DE1FF" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx={last[0]} cy={last[1]} r="3" fill="#F3F7FC" />
        </svg>
      </figure>
      <ol aria-label="Mission log" className="flex min-h-[92px] flex-col gap-1.5 px-4 pb-1.5 pt-2.5">
        {events.map((l, k) => <li key={k} className="grid grid-cols-[44px_1fr] gap-2 text-[12.5px] leading-snug"><span className="font-mono text-[10.5px] leading-[1.6] text-[#6F7D93]">D{pad(l.day)}</span><span style={{ color: COL[l.type] ?? '#C4CEDD' }}>{l.text.replace(/\s*\(.*?\)\.?$/, '')}</span></li>)}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1B273A] px-4 pb-3.5 pt-2.5 text-xs text-[#6F7D93]">
        <span>Sample run: balanced setup, safe choices</span><Link href="/missions" className="font-medium text-[#5DE1FF]">Play it yourself →</Link>
      </div>
    </aside>
  );
}

function Hero({ vw }: { vw: number }) {
  return (
    <header id="top" className="relative flex min-h-[max(100vh,820px)] items-center overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_75%_15%,#0E1A30_0%,#05080F_62%)]">
      <div aria-hidden className="absolute inset-0"><Sky /></div>
      <div aria-hidden className="absolute -left-[30%] -right-[30%] -bottom-[96%] h-[130%] rounded-[50%] bg-[radial-gradient(ellipse_60%_40%_at_60%_0%,#A3A8B1_0%,#61666F_15%,#2B2F37_38%,#0C0F15_68%)] shadow-[inset_0_2px_0_rgba(255,255,255,.14)]">
        <div className="absolute left-[36%] top-[4.5%] h-[3%] w-[9%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_30%,rgba(0,0,0,.45),rgba(0,0,0,0)_70%)]" />
        <div className="absolute left-[61%] top-[8%] h-[2%] w-[5%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_30%,rgba(0,0,0,.4),rgba(0,0,0,0)_70%)]" />
        <div className="absolute left-[48%] top-[13%] h-[3.6%] w-[13%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_30%,rgba(0,0,0,.35),rgba(0,0,0,0)_70%)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,15,.85)_0%,rgba(5,8,15,.35)_48%,rgba(5,8,15,0)_70%),linear-gradient(0deg,#05080F_0%,rgba(5,8,15,0)_22%)]" />
      <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] items-center gap-12 px-[clamp(20px,4vw,56px)] pb-[90px] pt-[150px]">
        <div className="max-w-[760px]">
          <div className="mb-[26px] flex flex-wrap items-center gap-x-4 gap-y-2.5 font-mono text-xs font-medium tracking-[.18em]">
            <span className="text-[#5DE1FF]">JUNIOR ASTRONAUT MISSION SIMULATOR</span><span className="h-px w-6 bg-[#3A4E6B]" /><span className="text-[#91A0B7]">LUNAR SURFACE OPERATIONS</span>
          </div>
          <h1 className="text-balance text-[clamp(44px,6.6vw,96px)] font-semibold leading-[.94] tracking-[-.035em] [text-shadow:0_2px_24px_rgba(0,0,0,.6)]">YOUR MISSION.<br />YOUR DECISIONS.<br /><span className="text-[#C4CEDD]">HUMANITY&apos;S FUTURE.</span></h1>
          <p className="mt-[26px] text-[clamp(18px,1.5vw,22px)] font-medium text-[#5DE1FF]">Every Decision Shapes the Mission.</p>
          <p className="mt-3.5 max-w-[560px] text-pretty text-[clamp(16px,1.25vw,18px)] leading-relaxed text-[#E3E9F2]">Command a four-person lunar outpost. Balance power, oxygen, water, food and radiation protection on a fixed budget, then live with the consequences, one simulated day at a time.</p>
          <div className="mt-[34px] flex flex-wrap gap-3">
            <Link href="/missions" className={cn(BTN, 'h-[54px] bg-[#5DE1FF] px-[26px] text-sm text-[#04111A] hover:bg-[#8BEBFF]')}>BEGIN MISSION <ArrowRight className="size-[18px]" /></Link>
            <Link href="/science" className={cn(BTN, 'h-[54px] border border-[#2E3F58] bg-[rgba(10,16,28,.6)] px-[22px] text-sm font-medium text-[#F3F7FC] hover:border-[#5DE1FF]')}><FlaskConical className="size-[17px]" />EXPLORE THE SCIENCE</Link>
          </div>
        </div>
        <LiveConsole align={vw >= 1180 ? 'end' : 'center'} />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[2] border-t border-[rgba(36,50,71,.7)] bg-[rgba(5,8,15,.72)] backdrop-blur-[10px]">
        <dl className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(130px,1fr))] px-[clamp(20px,4vw,56px)]">
          {[['Crew', '4 astronauts'], ['Duration', '12–30 days'], ['Budget', '100 credits'], ['Systems', '7 to build'], ['Scenarios', '4 playable']].map(([k, v], i) => (
            <div key={k} className={cn('py-4', i && 'pl-5', i < 4 && 'border-r border-[#172235]')}><dt className="mb-1.5 font-mono text-[10px] tracking-[.14em] text-[#6F7D93]">{k.toUpperCase()}</dt><dd className="text-xl font-semibold">{v}</dd></div>))}
        </dl>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- 01 how */
function HowItWorks() {
  const reduce = useReduce();
  const [step, setStep] = useState(0), [auto, setAuto] = useState(true);
  useEffect(() => { if (reduce || !auto) return; const t = setInterval(() => !document.hidden && setStep(s => (s + 1) % 4), 3400); return () => clearInterval(t); }, [auto, reduce]);
  const sun = SUN.slice(6, 20), sc = step === 3 ? 812 : 0;
  const Card = ({ n, Icon, title, text, children }: { n: number; Icon: LucideIcon; title: string; text: string; children: React.ReactNode }) => { const on = step === n; return (
    <li><button onClick={() => { setStep(n); setAuto(false); }} aria-pressed={on} className={cn('flex size-full flex-col overflow-hidden rounded-2xl border text-left transition-colors', on ? 'border-[#2F5A73] bg-gradient-to-b from-[#0E1A2A] to-[#0A101C]' : 'border-[#1B273A] bg-[#0A101C]')}>
      <span className="block h-0.5 bg-[#172235]"><span className="block h-full bg-[#5DE1FF]" style={{ width: on ? '100%' : '0%', transition: on && auto ? 'width 3.4s linear' : 'none' }} /></span>
      <span className="flex flex-col gap-[18px] p-[22px]">
        <span className="flex items-center justify-between"><span className="font-mono text-xs font-medium tracking-[.14em] text-[#5DE1FF]">STEP 0{n + 1}</span><Icon className="size-[18px]" /></span>
        <span className="flex h-24 flex-col justify-center gap-2 rounded-[10px] border border-[#172235] bg-[#060A13] p-3.5">{children}</span>
        <span className="text-[21px] font-semibold tracking-[-.01em]">{title}</span>
        <span className="text-[14.5px] leading-relaxed text-[#91A0B7]">{text}</span>
      </span>
    </button></li>); };
  return (
    <section id="how" aria-labelledby="how-h" className="mx-auto max-w-[1440px] px-[clamp(20px,4vw,56px)] py-[clamp(80px,10vw,140px)]">
      <div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-16 gap-y-6">
        <div><div className={KICK}>01 — How a mission works</div><h2 id="how-h" className={H2}>Plan it. Run it. Live with it.</h2></div>
        <p className="max-w-[460px] leading-relaxed text-[#91A0B7]">One loop, four steps. Every number you see comes from the same simulation engine that runs the game.</p>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,290px),1fr))] gap-4">
        <Card n={0} Icon={Wrench} title="Configure the outpost" text="Spend a fixed budget on seven systems. Level 1 of everything costs 105, so something has to give.">
          <span className="flex justify-between font-mono text-[10px] text-[#6F7D93]"><span>BUDGET</span><span>{step === 0 ? 10 : 100} cr left</span></span>
          <span className="flex h-3 gap-[3px] overflow-hidden rounded-[3px] bg-[#172235]">{['#5DE1FF', '#739CFF', '#57D9A3'].map((c, k) => <span key={c} style={{ width: step === 0 ? '30%' : '0%', background: c, transition: `width .8s ${k * .2}s` }} />)}</span>
          <span className="text-[11.5px] text-[#91A0B7]">Solar · Oxygen · Greenhouse</span>
        </Card>
        <Card n={1} Icon={Clock} title="Advance one day" text="Oxygen, water, food and power change by real daily rates. Sunlight fades behind the terrain mid-mission.">
          <span className="flex items-center gap-3.5">
            <span className="tnum text-[30px] font-semibold leading-none">D{step === 1 ? '14' : '07'}</span>
            <span className="flex h-[46px] flex-1 items-end gap-0.5">{sun.map((s, k) => <span key={k} className="flex-1 rounded-[1px] transition-colors" style={{ height: `${Math.max(12, s * 100)}%`, background: step === 1 && k <= 7 ? (s < .5 ? '#FFC66D' : '#5DE1FF') : '#243247' }} />)}</span>
          </span>
        </Card>
        <Card n={2} Icon={AlertTriangle} title="Decide under pressure" text="Storms, leaks and faults arrive at random. Each choice previews its cost, and the engine decides the outcome.">
          <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#FF6B78]">SOLAR STORM · DAY 06</span>
          <span className={cn('flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors', step === 2 ? 'border-[#5DE1FF]' : 'border-[#243247]')}><span className={cn('size-2.5 rounded-full border-[1.5px]', step === 2 ? 'border-[#5DE1FF] bg-[#5DE1FF]' : 'border-[#243247]')} />Shelter the crew</span>
          <span className="flex items-center gap-2 rounded-md border border-[#243247] px-2 py-1.5 text-xs text-[#91A0B7]"><span className="size-2.5 rounded-full border-[1.5px] border-[#3A4E6B]" />Keep working outside</span>
        </Card>
        <Card n={3} Icon={Award} title="Debrief and replay" text="See exactly how your score was calculated, what went wrong, and what to try next time.">
          <span className="flex items-center gap-4">
            <span className="grid size-[68px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#57D9A3 0 ${sc / 10}%, #172235 ${sc / 10}% 100%)` }}><span className="tnum grid size-[54px] place-items-center rounded-full bg-[#060A13] text-[15px] font-semibold">{step === 3 ? sc : '—'}</span></span>
            <span className="text-xs leading-normal text-[#91A0B7]">Crew safety · Science<br />Resource margins · Response</span>
          </span>
        </Card>
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- 03 systems */
const NODES: { id: string; name: string; Icon: LucideIcon; x: number; y: number; color: string; tag: string; what: string; needs: string; feeds: string; value: string; fail: string }[] = [
  { id: 'solar', name: 'Solar arrays', Icon: Sun, x: .12, y: .5, color: '#FFC66D', tag: 'Energy · Generation', what: 'Turns sunlight into electricity. Output falls when terrain shadows the site, and stops completely during a lunar night.', needs: 'Sunlight', feeds: 'Battery', value: `${P.solarPerLevel} kWh/day per array at full sun`, fail: 'The battery stops charging. Within days, the outpost starts cutting power to other systems.' },
  { id: 'battery', name: 'Battery', Icon: Battery, x: .33, y: .5, color: '#5DE1FF', tag: 'Energy · Storage', what: 'Stores surplus energy for shadowed days. It makes the outpost resilient, but never creates energy.', needs: 'Solar arrays', feeds: 'Oxygen, water recycling, greenhouse, habitat', value: `${P.batteryBase} + ${P.batteryPerLevel} kWh per level`, fail: 'Loads are cut in order: research, greenhouse, water recycling, then oxygen.' },
  { id: 'water', name: 'Water recycler', Icon: Droplets, x: .56, y: .18, color: '#739CFF', tag: 'Water', what: 'Cleans used water so the crew can reuse it. It slows water loss but never stops it.', needs: 'Power', feeds: 'Oxygen generator, greenhouse, crew', value: `${P.waterPerCrew} L per astronaut per day · 75–95% recovered`, fail: 'Every litre used is lost, and the oxygen generator runs out of water to split.' },
  { id: 'oxygen', name: 'Oxygen generator', Icon: Wind, x: .56, y: .5, color: '#A9E8F5', tag: 'Life support', what: 'Splits water into oxygen and hydrogen using electricity. Better air always costs water and power.', needs: 'Power and water', feeds: 'Crew', value: `1 kg O₂ splits ${P.electrolysis} kg of water`, fail: 'The crew breathes from a finite tank. When it is empty, the mission is aborted.' },
  { id: 'greenhouse', name: 'Greenhouse', Icon: Sprout, x: .56, y: .82, color: '#57D9A3', tag: 'Food', what: 'Grows fresh food under LED light. It costs power and water long before the first harvest.', needs: 'Power, water and time', feeds: 'Crew', value: `First harvest on day ${P.ghMature}`, fail: 'The crew eats packaged food only, which runs low on longer missions.' },
  { id: 'shield', name: 'Storm shelter', Icon: Shield, x: .84, y: .18, color: '#8FB4FF', tag: 'Radiation', what: 'Shielding mass blocks part of a solar storm’s hazard. It is idle until a storm arrives.', needs: 'Construction credits', feeds: 'Crew safety', value: 'Blocks 20–90% of storm hazard (game value)', fail: 'Solar storms raise crew exposure. Unsafe choices lower your score.' },
  { id: 'crew', name: 'Crew of four', Icon: Users, x: .84, y: .62, color: '#F3F7FC', tag: 'The mission', what: 'Everything exists to keep four astronauts healthy enough to work and do science.', needs: 'Oxygen, water, food, shelter', feeds: 'Science objectives', value: `${P.o2PerCrew} kg O₂ and ${P.foodPerCrew} kg food per person per day`, fail: 'Crew health falls. If oxygen or health reaches zero, the mission ends.' },
];
const LINKS: [number, number][] = [[0, 1], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 6], [4, 6], [2, 6], [5, 6]];

function Systems() {
  const [node, setNode] = useState(3), s = NODES[node];
  return (
    <section id="systems" aria-labelledby="sys-h" className="border-y border-[#121B2A] bg-[#070B14]">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,4vw,56px)] py-[clamp(80px,10vw,130px)]">
        <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-16 gap-y-6">
          <div><div className={KICK}>03 — Systems thinking</div><h2 id="sys-h" className={H2}>Seven systems. One machine.</h2></div>
          <p className="max-w-[460px] leading-relaxed text-[#91A0B7]">Energy flows into everything. Water becomes air. Light becomes food. Select a system to see what it needs and what fails without it.</p>
        </div>
        <div className="flex flex-wrap items-stretch gap-5">
          <div className="relative aspect-video min-h-[360px] min-w-0 flex-[3_1_560px] overflow-hidden rounded-[18px] border border-[#1B273A] bg-[#060A13] [background-image:linear-gradient(rgba(93,225,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(93,225,255,.035)_1px,transparent_1px)] [background-size:40px_40px]">
            <div aria-hidden className="absolute inset-0"><Flow nodes={NODES} links={LINKS} active={node} /></div>
            {NODES.map((n, k) => { const on = k === node, rel = LINKS.some(([a, b]) => (a === node && b === k) || (b === node && a === k)); return (
              <button key={n.id} onClick={() => setNode(k)} aria-pressed={on} style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%`, borderColor: on ? n.color : rel ? '#3A4E6B' : '#243247', boxShadow: on ? `0 0 0 4px ${n.color}22, 0 0 30px -8px ${n.color}` : 'none' }}
                className={cn('absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold transition-[border-color,box-shadow,background-color] hover:!border-[#5DE1FF]', on ? 'bg-[#0F1C2B]' : 'bg-[rgba(10,16,28,.94)]')}>
                <n.Icon className="size-4" style={{ color: n.color }} />{n.name}
              </button>); })}
            <div className="absolute bottom-3.5 left-4 font-mono text-[10px] tracking-[.14em] text-[#6F7D93]">FLOW DIAGRAM · ARROWS SHOW WHAT FEEDS WHAT</div>
          </div>
          <aside aria-live="polite" aria-label="Selected system" className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px] rounded-[18px] border border-[#1B273A] bg-[#0A101C] p-[26px]">
            <div className="flex items-center gap-3.5">
              <span className="grid size-[46px] place-items-center rounded-xl border" style={{ borderColor: s.color + '66', background: s.color + '14', color: s.color }}><s.Icon className="size-[22px]" /></span>
              <div><div className={cn(MONO, 'mb-1.5 text-[#91A0B7]')}>{s.tag}</div><div className="text-[22px] font-semibold tracking-[-.01em]">{s.name}</div></div>
            </div>
            <p className="text-[15px] leading-relaxed text-[#DCE4EF]">{s.what}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13.5px] leading-snug">
              <dt className="text-[#91A0B7]">Needs</dt><dd>{s.needs}</dd><dt className="text-[#91A0B7]">Feeds</dt><dd>{s.feeds}</dd><dt className="text-[#91A0B7]">Game value</dt><dd className="tnum">{s.value}</dd>
            </dl>
            <div className="mt-auto flex gap-2.5 rounded-[10px] border border-[rgba(255,107,120,.25)] bg-[rgba(255,107,120,.06)] px-3.5 py-3 text-[13.5px] leading-normal text-[#E3E9F2]"><AlertTriangle className="mt-px size-[15px] shrink-0 text-[#FF6B78]" /><span><b className="text-[#FFB3BA]">If it fails:</b> {s.fail}</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 04 trade-offs */
type AKey = 'shield' | 'battery' | 'food';
function TradeOffs() {
  const [a, setA] = useState<Record<AKey, number>>({ shield: 20, battery: 20, food: 20 });
  const set = (key: AKey, v: number) => { const n = { ...a, [key]: v } as Record<AKey, number>; const o = (Object.keys(n) as AKey[]).filter(k => k !== key), sum = o.reduce((t, k) => t + a[k], 0);
    n[o[0]] = Math.max(0, Math.round(((sum ? a[o[0]] / sum : .5) * (60 - v)) / 5) * 5); n[o[1]] = Math.max(0, 60 - v - n[o[0]]); setA(n); };
  const band = (v: number): [string, LucideIcon] => (v >= 30 ? ['#57D9A3', CheckCircle2] : v >= 15 ? ['#FFC66D', AlertTriangle] : ['#FF6B78', OctagonAlert]);
  const rows: { key: AKey; Icon: LucideIcon; label: string; metric: string; result: string }[] = [
    { key: 'shield', Icon: Shield, label: 'Radiation shielding', metric: 'Storm exposure risk', result: a.shield >= 30 ? 'Low' : a.shield >= 15 ? 'Moderate' : 'High' },
    { key: 'battery', Icon: Battery, label: 'Battery storage', metric: 'Shadow-period endurance', result: `${(1 + a.battery / 10).toFixed(1)} days` },
    { key: 'food', Icon: Sprout, label: 'Food production', metric: 'Food grown on site', result: `${Math.min(80, Math.round(a.food * 1.4))}% of demand` },
  ];
  const weakest = [...rows].sort((x, y) => a[x.key] - a[y.key])[0];
  const verdict = rows.every(r => a[r.key] >= 15) ? 'A spread-out plan avoids any single weak point, but nothing is strong. One bad event could still push a system into the red.' : `Your ${weakest.label.toLowerCase()} is underfunded. That is a real strategy, until the event that tests it arrives.`;
  return (
    <section aria-labelledby="cost-h" className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(40px,6vw,96px)] px-[clamp(20px,4vw,56px)] py-[clamp(80px,10vw,130px)]">
      <div>
        <div className={KICK}>04 — Trade-offs</div>
        <h2 id="cost-h" className={cn(H2, 'mb-5')}>Every decision has a cost.</h2>
        <p className="mb-7 max-w-[480px] leading-relaxed text-[#91A0B7]">Try it: 60 credits across three systems. Raise one slider and the others shrink. The budget never grows.</p>
        <div className="flex items-baseline gap-3"><span className={cn(MONO, 'text-[11px] text-[#91A0B7]')}>Budget committed</span><span className="tnum text-[30px] font-semibold">{a.shield + a.battery + a.food}</span><span className="text-[#91A0B7]">/ 60 cr</span></div>
      </div>
      <div className="flex flex-col gap-[26px] rounded-[18px] border border-[#1B273A] bg-[#0A101C] p-[clamp(20px,3vw,32px)]">
        {rows.map(r => { const [c, SI] = band(a[r.key]); return (
          <div key={r.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] border border-[#243247] bg-[#121D2E] text-[#5DE1FF]"><r.Icon className="size-[18px]" /></span>
              <label htmlFor={`al-${r.key}`} className="flex-1 font-medium">{r.label}</label>
              <span className="tnum font-semibold">{a[r.key]} <span className="font-normal text-[#91A0B7]">cr</span></span>
            </div>
            <input id={`al-${r.key}`} type="range" min={0} max={60} step={5} value={a[r.key]} onChange={e => set(r.key, +e.target.value)} aria-valuetext={`${a[r.key]} credits`} className="w-full accent-[#5DE1FF]" />
            <div className="flex justify-between gap-3 text-[13px]"><span className="text-[#91A0B7]">{r.metric}</span><span className="flex items-center gap-1.5 font-medium" style={{ color: c }}><SI className="size-3.5" />{r.result}</span></div>
          </div>); })}
        <div className="flex items-start gap-3 border-t border-[#1B273A] pt-[18px] text-sm leading-normal text-[#C4CEDD]"><Info className="mt-px size-[18px] shrink-0 text-[#FFC66D]" /><span>{verdict}</span></div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 05 scenarios */
const U = 'https://www.nasa.gov/wp-content/uploads/2026/05/';
const SIMG: Record<ScenarioId, [string, string]> = {
  outpost: ['moon-background.png', 'Artist’s rendering of the lunar South Pole region'],
  night: ['solararray-lander-beautyshot.png', 'Artist’s rendering of a tall vertical solar array on the lunar surface'],
  storm: ['lunar-clps-lander-fromstmd-gofor.png', 'Artist’s rendering of a lander descending near a lunar habitat'],
  water: ['cpc-logistics-actionshot-1.png', 'Artist’s rendering of two astronauts working beside a lunar habitat'],
};
function Scenarios() {
  const router = useRouter(), setScenario = useMissionStore(s => s.setScenario);
  return (
    <section id="scenarios" aria-labelledby="scn-h" className="border-t border-[#121B2A] bg-[#070B14]">
      <div className="mx-auto max-w-[1440px] px-[clamp(20px,4vw,56px)] py-[clamp(80px,10vw,130px)]">
        <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-16 gap-y-6">
          <div><div className={KICK}>05 — Mission scenarios</div><h2 id="scn-h" className={H2}>Four missions. Four lessons.</h2></div>
          <p className="max-w-[460px] leading-relaxed text-[#91A0B7]">Each scenario stresses a different system. All four are playable now. Mars is designed but not yet playable.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {Object.values(SCENARIOS).map(c => { const dc = c.difficulty === 'Hard' ? '#FF8A94' : c.difficulty === 'Explorer' ? '#57D9A3' : '#FFC66D'; return (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#1B273A] bg-[#0A101C] hover:border-[#2E4560]">
              <div className="relative h-[180px] bg-[#0D1422]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${U}${SIMG[c.id][0]}?w=1200`} alt={SIMG[c.id][1]} loading="lazy" className="absolute inset-0 block size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A101C] to-transparent to-60%" />
                <span className="absolute left-3.5 top-3.5 rounded-full border bg-[rgba(5,8,15,.8)] px-2.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-[.12em]" style={{ borderColor: dc, color: dc }}>{c.difficulty.toUpperCase()}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-1.5">
                <div className={cn(MONO, 'text-[#91A0B7]')}>{c.days} days · {c.budget} credits</div>
                <h3 className="text-[22px] font-semibold tracking-[-.01em]">{c.name}</h3>
                <p className="text-sm leading-relaxed text-[#C4CEDD]">{c.goal}</p>
                <p className="flex gap-2 text-[13px] leading-normal text-[#5DE1FF]"><FlaskConical className="mt-0.5 size-3.5 shrink-0" />{c.lesson}</p>
                <button onClick={() => { setScenario(c.id); router.push('/missions/lunar-alpha/configure'); }} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#2E3F58] text-[13px] font-semibold tracking-[.04em] hover:border-[#5DE1FF] hover:bg-[rgba(93,225,255,.06)]">Play this scenario <ArrowRight className="size-[15px]" /></button>
              </div>
            </article>); })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 06 science, 07 team, CTA, footer */
function ScienceData() {
  const [sw, setSw] = useState<SpaceWeather | null>(null);
  useEffect(() => { fetch('/api/space-weather').then(r => r.json()).then(setSw).catch(() => setSw({ status: 'curated', tier: 'elevated' })); }, []);
  const C = { live: '#57D9A3', cached: '#5DE1FF', curated: '#FFC66D' } as const, col = sw ? C[sw.status] : '#91A0B7';
  const status = !sw ? 'CHECKING…' : sw.status === 'live' ? 'LIVE' : sw.status === 'cached' ? 'CACHED' : 'OFFLINE';
  const label = !sw ? 'Checking NASA for recent solar activity…' : sw.status === 'curated' ? 'NASA could not be reached right now, so the game uses its built-in storm scenario.' : `${sw.label ?? 'Recent solar activity'}.`;
  const refs: [string, string][] = [
    ['ECLSS life-support fact sheet', 'https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf'],
    ['Artemis crew radiation protection', 'https://ntrs.nasa.gov/citations/20250002757'],
    ['Fission Surface Power', 'https://www.nasa.gov/centers-and-facilities/glenn/nasas-fission-surface-power-project-energizes-lunar-exploration'],
    ['Growing plants in space', 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/'],
  ];
  return (
    <section id="science" aria-labelledby="sci-h" className="mx-auto max-w-[1440px] px-[clamp(20px,4vw,56px)] py-[clamp(80px,10vw,130px)]">
      <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-16 gap-y-6">
        <div><div className={KICK}>06 — Science &amp; data</div><h2 id="sci-h" className={H2}>Honest about every number.</h2></div>
        <p className="max-w-[460px] leading-relaxed text-[#91A0B7]">LunaQuest is an educational game, not an engineering tool. Every value is labelled as NASA data, NASA reference, a simplified assumption or a game rule.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-px overflow-hidden rounded-[18px] border border-[#1B273A] bg-[#1B273A]">
        <div className="flex flex-col gap-3.5 bg-[#0A101C] p-7">
          <div className="flex items-center justify-between gap-2.5"><span className={cn(MONO, 'font-semibold text-[#57D9A3]')}>NASA data</span>
            <span role="status" className="flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] font-semibold tracking-[.1em]" style={{ borderColor: col + '66', color: col }}>{status}</span></div>
          <div className="text-xl font-semibold leading-snug">DONKI space weather</div>
          <p className="text-sm leading-relaxed text-[#C4CEDD]">Recent solar flares and particle events from NASA set how severe the in-game storm is. They are never presented as radiation measured on the Moon.</p>
          <p className="text-[12.5px] leading-normal text-[#91A0B7]">{label}</p>
        </div>
        <div className="flex flex-col gap-3.5 bg-[#0A101C] p-7">
          <span className={cn(MONO, 'font-semibold text-[#5DE1FF]')}>NASA references</span>
          <div className="text-xl font-semibold leading-snug">Explanations you can check</div>
          <ul className="flex flex-col gap-2 text-sm">{refs.map(([t, u]) => <li key={t}><a href={u} target="_blank" rel="noopener noreferrer" className="text-[#C4CEDD] hover:text-[#5DE1FF]">{t} ↗</a></li>)}</ul>
        </div>
        <div className="flex flex-col gap-3.5 bg-[#0A101C] p-7">
          <span className={cn(MONO, 'font-semibold text-[#FFC66D]')}>Game rules</span>
          <div className="text-xl font-semibold leading-snug">Simple, visible, testable</div>
          <p className="text-sm leading-relaxed text-[#C4CEDD]">One step per day. Every rate, cost and capacity is published, and an automated test suite checks the engine keeps its own rules.</p>
          <Link href="/sources" className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-[#5DE1FF]">See all sources &amp; limits <ArrowRight className="size-[15px]" /></Link>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section aria-labelledby="team-h" className="border-t border-[#121B2A] bg-[#070B14]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-x-16 gap-y-8 px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,100px)]">
        <div>
          <div className={KICK}>07 — Mission team</div>
          <h2 id="team-h" className="mb-3.5 text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.05] tracking-[-.03em]">Meet the crew</h2>
          <p className="max-w-[460px] leading-relaxed text-[#91A0B7]">Built for NASA Space Apps Challenge 2026 to help young learners see a lunar habitat as one connected system.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {['Mehedi Hasan', 'Maimuna Rahman', 'Nahid Hasan', 'Joy Barua'].map((n, i) => (
            <li key={n} className="rounded-[14px] border border-[#1B273A] bg-[#0A101C] px-5 py-[18px]"><div className={cn(MONO, 'mb-2.5 text-[#5DE1FF]')}>Crew 0{i + 1}</div><div className="text-lg font-semibold">{n}</div></li>))}
        </ul>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section aria-labelledby="cta-h" className="relative overflow-hidden border-t border-[#121B2A] px-[clamp(20px,4vw,56px)] py-[clamp(100px,14vw,180px)] text-center">
      <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[min(1100px,160vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#121B2A]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[min(760px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#172235]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[min(420px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(93,225,255,.08),rgba(93,225,255,0)_70%)]" />
      <div className="relative">
        <div className="mb-[22px] font-mono text-xs font-medium tracking-[.18em] text-[#91A0B7]">T-MINUS ONE DECISION</div>
        <h2 id="cta-h" className="mb-8 text-balance text-[clamp(40px,6vw,84px)] font-semibold leading-[.98] tracking-[-.035em]">READY TO COMMAND<br />THE MOON?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/missions" className={cn(BTN, 'h-14 bg-[#5DE1FF] px-7 text-sm text-[#04111A] hover:bg-[#8BEBFF]')}>BEGIN MISSION <ArrowRight className="size-[18px]" /></Link>
          <Link href="/science" className={cn(BTN, 'h-14 border border-[#2E3F58] px-6 text-sm font-medium hover:border-[#5DE1FF]')}>EXPLORE THE SCIENCE</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const col = (title: string, items: [string, string, boolean?][]) => (
    <nav aria-label={title} className="flex flex-col gap-3 text-sm">
      <div className={cn(MONO, 'mb-1 text-[11px] text-[#6F7D93]')}>{title}</div>
      {items.map(([t, href, ext]) => ext ? <a key={t} href={href} target="_blank" rel="noopener noreferrer" className="text-[#C4CEDD] hover:text-[#F3F7FC]">{t}</a> : <Link key={t} href={href} className="text-[#C4CEDD] hover:text-[#F3F7FC]">{t}</Link>)}
    </nav>);
  return (
    <footer id="about" className="border-t border-[#121B2A] bg-[#020409]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-10 px-[clamp(20px,4vw,56px)] pb-9 pt-14">
        <div className="min-w-0 max-w-[460px] sm:col-span-2">
          <div className="mb-4 flex items-center gap-2.5"><Emblem size={28} /><span className="text-[17px] font-semibold">LunaQuest</span></div>
          <p className="mb-3.5 text-sm leading-relaxed text-[#91A0B7]">An educational mission simulator for the NASA Space Apps Challenge 2026 challenge “Build a Junior Astronaut Mission Trainer.”</p>
          <p className="text-[13px] leading-relaxed text-[#6F7D93]">Not affiliated with or endorsed by NASA. Gameplay values are simplified for learning and must not be used for real mission or spacecraft design.</p>
        </div>
        {col('Play', [['Missions', '/missions'], ['Configure outpost', '/missions/lunar-alpha/configure'], ['Mission Control', '/mission'], ['3D mission', '/play-3d'], ['Debrief', '/mission/debrief']])}
        {col('Learn', [['Science Lab', '/science'], ['Design system', '/design-system'], ['NASA Space Apps Challenge ↗', 'https://www.spaceappschallenge.org/', true]])}
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-3 border-t border-[#121B2A] px-[clamp(20px,4vw,56px)] pb-[30px] pt-[18px] text-xs text-[#6F7D93]">
        <span>© 2026 LunaQuest · Educational use</span><span>Scenario imagery: artist’s renderings courtesy NASA. Use does not imply NASA endorsement.</span>
      </div>
    </footer>
  );
}

export function Landing() {
  const vw = useVW();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05080F] text-[#F3F7FC]">
      <TopStrip vw={vw} />
      <Nav vw={vw} />
      <Hero vw={vw} />
      <HowItWorks />
      <DayByDay />
      <Systems />
      <TradeOffs />
      <Scenarios />
      <ScienceData />
      <Team />
      <CTA />
      <Footer />
    </div>
  );
}
