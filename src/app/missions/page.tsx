import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Lock, Package, Shield, Thermometer, Wind, Zap } from 'lucide-react';
import { SetupHeader } from '@/components/lq/setup-header';
import { ImageSlot } from '@/components/lq/image-slot';
import { MissionCompare } from '@/components/lq/mission-compare';
import { SectionLabel } from '@/components/lq/status';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Mission Selection' };

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
      {items.map(([k, v]) => <div key={k} className="bg-surface p-3.5"><dt className="mb-1.5 text-xs text-ink-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
    </dl>
  );
}
function Chips({ items }: { items: [React.ElementType, string][] }) {
  return (
    <div><div className="mb-2.5 text-xs text-ink-muted">Main challenge</div>
      <div className="flex flex-wrap gap-2">{items.map(([I, t]) => <span key={t} className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-1.5 text-[13px]"><I className="size-[15px]" />{t}</span>)}</div>
    </div>
  );
}

export default function MissionsPage() {
  return (
    <>
      <SetupHeader step={0} />
      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-[clamp(40px,6vw,72px)] md:px-12">
        <SectionLabel className="mb-3.5">Select a mission</SectionLabel>
        <h1 className="mb-3 text-[clamp(34px,4.4vw,56px)] font-semibold leading-none tracking-[-.03em]">Where will you build?</h1>
        <p className="mb-10 max-w-[560px] leading-relaxed text-ink-muted">Each destination tests different engineering skills. Start on the Moon — Mars unlocks as an advanced mission.</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <article aria-labelledby="m-moon" className="flex flex-col overflow-hidden rounded-2xl border border-[#3A5A7A] bg-surface shadow-[0_30px_80px_-40px_rgba(93,225,255,.35)]">
            <div className="relative h-[clamp(220px,26vw,320px)]">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_120%,#5C616B_0%,#2A2E36_40%,#0D1016_70%,#070B14_100%)]" />
              <ImageSlot src="/missions/moon.png" priority alt="The Moon's cratered limb seen from orbit, with a crescent Earth rising beyond it" label="Lunar surface with Earth on the horizon" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface to-transparent to-55%" />
              <Badge className="absolute left-4 top-4">Primary mission</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-5 px-7 pb-7 pt-2">
              <div><div className="label mb-2">LQ-A1 · Earth&apos;s Moon</div><h2 id="m-moon" className="text-[32px] font-semibold tracking-[-.02em]">Lunar Outpost</h2></div>
              <Facts items={[['Environment', 'Moon'], ['Duration', '30 days'], ['Difficulty', <span key="d" className="text-warning">Intermediate</span>], ['Crew size', '4']]} />
              <Chips items={[[Shield, 'Radiation'], [Thermometer, 'Extreme temperature'], [Zap, 'Power availability']]} />
              <Link href="/missions/lunar-alpha/briefing" className={cn(buttonVariants({ size: 'lg' }), 'mt-auto')}>SELECT LUNAR MISSION <ArrowRight /></Link>
            </div>
          </article>

          <article aria-labelledby="m-mars" className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="relative h-[clamp(220px,26vw,320px)]">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_120%,#7A4A35_0%,#3D2420_40%,#140D0E_70%,#070B14_100%)]" />
              <ImageSlot src="/missions/mars.jpg" priority alt="Two suited astronauts beside a rover and linked habitat modules on orange Martian terrain" label="Martian terrain with habitat modules" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface to-transparent to-55%" />
              <Badge variant="neutral" className="absolute left-4 top-4"><Lock />In development</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-5 px-7 pb-7 pt-2">
              <div><div className="label mb-2">LQ-M1 · Mars</div><h2 id="m-mars" className="text-[32px] font-semibold tracking-[-.02em]">Mars Outpost</h2></div>
              <Facts items={[['Environment', 'Mars'], ['Duration', '30 days'], ['Difficulty', <span key="d" className="text-critical">Advanced</span>], ['Crew size', '4']]} />
              <Chips items={[[Wind, 'Dust'], [Package, 'Resource independence'], [AlertTriangle, 'Environmental hazards']]} />
              <div className="mt-auto flex flex-col gap-2.5">
                <Button size="lg" disabled aria-disabled className="border border-line bg-well text-ink-faint"><Lock />SELECT MARS MISSION</Button>
                <p className="text-center text-[13px] text-ink-muted">Gameplay for Mars is not yet implemented. Complete the lunar mission first.</p>
              </div>
            </div>
          </article>
        </div>

        <MissionCompare />
      </main>
    </>
  );
}
