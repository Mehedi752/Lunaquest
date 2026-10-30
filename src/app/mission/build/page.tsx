'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowRight, Check, Package } from 'lucide-react';
import { useMissionCtx } from '@/components/lq/mission/shell';
import { SimIcon } from '@/components/lq/icons';
import { SectionLabel } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMissionStore } from '@/lib/store';
import { EQUIPMENT, nextCost, type EquipmentId } from '@/lib/sim';
import { cn } from '@/lib/utils';

const CATS = ['All', 'Life Support', 'Energy', 'Water', 'Food Production', 'Radiation Protection', 'Emergency Systems'] as const;

function BuildCenter() {
  const params = useSearchParams();
  const initial = EQUIPMENT.find(e => e.id === params.get('system'))?.category ?? 'All';
  const { mission: m } = useMissionCtx();
  const buy = useMissionStore(s => s.buy);
  const [cat, setCat] = useState<string>(initial);
  const [pending, setPending] = useState<EquipmentId | null>(null);
  const active = m.status === 'active';

  const p = pending ? EQUIPMENT.find(e => e.id === pending)! : null;
  const pl = p ? m.levels[p.id] : 0;
  const pc = p ? nextCost(p.id, pl)! : 0;

  return (
    <main aria-label="Build and Upgrade Center" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel className="mb-2.5 text-[11px]">Engineering workshop</SectionLabel>
          <h1 className="text-[clamp(26px,3vw,36px)] font-semibold tracking-[-.025em]">Build &amp; Upgrade Center</h1>
          <p className="mt-2 text-sm text-ink-muted">Earn credits by completing science objectives. Spend them to strengthen weak systems.</p>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3">
          <Package className="size-5" />
          <div><div className="text-xs text-ink-muted">Credits available</div><div aria-live="polite" className="tnum text-2xl font-semibold">{m.credits}</div></div>
        </div>
      </div>

      <Tabs value={cat} onValueChange={setCat}>
        <TabsList aria-label="Equipment categories">{CATS.map(c => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}</TabsList>
      </Tabs>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3.5">
        {EQUIPMENT.filter(e => cat === 'All' || e.category === cat).map(e => {
          const l = m.levels[e.id], c = nextCost(e.id, l), maxed = c === null, afford = !maxed && m.credits >= c && active;
          return (
            <article key={e.id} aria-labelledby={`b-${e.id}`} className={cn('flex flex-col rounded-[14px] border bg-surface', l ? 'border-[#24384F]' : 'border-line-soft')}>
              <div className="flex items-center gap-3 border-b border-line-faint px-4 py-4">
                <span className="grid size-10 place-items-center rounded-[10px] border border-line bg-elevated text-cyan"><SimIcon name={e.icon} className="size-5" /></span>
                <div className="min-w-0 flex-1"><div className="label mb-1 text-[10px] text-ink-faint">{e.category}</div><h2 id={`b-${e.id}`} className="text-base font-semibold">{e.name} — Level {l}</h2></div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 px-4 py-3.5">
                <div className="rounded-[9px] border border-line-faint bg-well px-3 py-2.5"><div className="mb-1 text-[11px] text-ink-faint">NOW · L{l}</div><div className="tnum text-[13px]">{l ? e.effect(l) : e.id === 'battery' ? '20 kWh' : 'Not installed'}</div></div>
                <ArrowRight className="size-4 self-center text-cyan" />
                <div className={cn('rounded-[9px] border px-3 py-2.5', maxed ? 'border-line-faint bg-well' : 'border-cyan/30 bg-cyan/[.06]')}>
                  <div className="mb-1 text-[11px] text-ink-faint">{maxed ? 'MAXED' : `AFTER · L${l + 1}`}</div>
                  <div className={cn('tnum text-[13px]', maxed ? 'text-ink-muted' : 'text-cyan')}>{maxed ? 'Maximum level' : e.effect(l + 1)}</div>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 px-4 pb-3 text-[12.5px] leading-snug">
                <dt className="text-ink-muted">Expected effect</dt><dd>{e.purpose}</dd>
                <dt className="text-ink-muted">Operating cost</dt><dd>{e.operatingCost}</dd>
                <dt className="text-ink-muted">Limitation</dt><dd className="text-[#C9B48D]">{e.limitation}</dd>
              </dl>
              <div className="mt-auto flex items-center gap-2.5 border-t border-line-faint px-4 py-3.5">
                <div className="flex-1">
                  <div className="tnum text-lg font-semibold">{maxed ? '—' : `${c} credits`}</div>
                  <div className={cn('text-xs', !maxed && !afford ? 'text-critical-soft' : 'text-ink-muted')}>
                    {maxed ? 'Fully upgraded' : !active ? 'Mission ended' : afford ? `${m.credits - c} credits left after` : `Need ${c - m.credits} more credits`}
                  </div>
                </div>
                <Button size="sm" disabled={!afford} onClick={() => setPending(e.id)}>{maxed ? <Check /> : <ArrowRight />}{maxed ? 'Maxed' : l ? 'Upgrade' : 'Install'}</Button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-ink-faint">All values are illustrative game parameters.</p>

      <Dialog open={!!pending} onOpenChange={o => !o && setPending(null)}>
        <DialogContent className="max-w-[480px]">
          {p && (
            <>
              <DialogHeader className="gap-3.5">
                <div className="label font-semibold text-cyan">Confirm purchase</div>
                <DialogTitle>{p.name}: level {pl} → {pl + 1}</DialogTitle>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="rounded-[10px] border border-line-faint bg-well p-3"><div className="mb-1 text-[11px] text-ink-faint">BEFORE</div><div className="text-sm">{pl ? p.effect(pl) : 'Not installed'}</div></div>
                  <ArrowRight className="size-4 text-cyan" />
                  <div className="rounded-[10px] border border-cyan/30 bg-cyan/[.06] p-3"><div className="mb-1 text-[11px] text-ink-faint">AFTER</div><div className="text-sm text-cyan">{p.effect(pl + 1)}</div></div>
                </div>
                <dl className="grid grid-cols-[1fr_auto] gap-2 text-[13px]">
                  <dt className="text-ink-muted">Credits</dt><dd className="tnum">{m.credits} → <span className="font-semibold">{m.credits - pc}</span></dd>
                  <dt className="text-ink-muted">Added operating cost</dt><dd>{p.operatingCost}</dd>
                </dl>
                <DialogDescription className="text-[12.5px] text-[#C9B48D]">Credits spent here can’t be used for repairs during later emergencies.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" size="sm" onClick={() => setPending(null)}>Cancel</Button>
                <Button size="sm" onClick={() => { buy(p.id); setPending(null); }}>Apply upgrade</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function BuildPage() {
  return <Suspense><BuildCenter /></Suspense>;
}
