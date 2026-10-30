'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowRight, Battery, Check, ChevronDown, Droplets, FlaskConical, HeartPulse, OctagonAlert, Shield, Sprout, Wind,
} from 'lucide-react';
import { SimIcon } from '@/components/lq/icons';
import { OUTCOME, STATUS, TONE } from '@/components/lq/status';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { RadioCard, RadioDot, RadioGroup } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/primitives';
import type { EventView, MissionState, Outcome, ResourceView } from '@/lib/sim';
import { AdvicePanel } from './advice-panel';
import { cn, f0, f1, pad2 } from '@/lib/utils';

/** Emergency-event modal: choose → confirm (engine resolves) → outcome → dismiss. Cannot be skipped. */
export function EventDialog({ mission, event, R, outcome, onConfirm, onDismiss }: {
  mission: MissionState; event: EventView | null; R: ResourceView; outcome: Outcome | null;
  onConfirm: (choiceId: string) => void; onDismiss: () => void;
}) {
  const [choice, setChoice] = useState('');
  const [last, setLast] = useState<EventView | null>(event);
  useEffect(() => { if (event) { setLast(event); setChoice(''); } }, [event?.id, mission.day]); // eslint-disable-line react-hooks/exhaustive-deps

  const ev = event ?? last;
  const open = !!event || !!outcome;
  if (!ev) return null;
  const crit = ev.severity === 'critical';

  const readouts: Record<EventView['resources'][number], [React.ElementType, string, string, string]> = {
    radiation: [Shield, 'Shelter', R.radiation.tier, 'text-ink-2'],
    health: [HeartPulse, 'Crew health', f0(mission.health), mission.health < 40 ? 'text-critical' : mission.health < 70 ? 'text-warning' : 'text-success'],
    power: [Battery, 'Battery', `${f0(R.power.value)} kWh`, STATUS[R.power.status].text],
    oxygen: [Wind, 'Oxygen', `${f1(R.o2.value)} kg`, STATUS[R.o2.status].text],
    water: [Droplets, 'Water', `${f0(R.water.value)} L`, STATUS[R.water.status].text],
    food: [Sprout, 'Food', `${f0(R.food.value)} kg`, STATUS[R.food.status].text],
  };
  const O = outcome ? OUTCOME[outcome.tone] : null;

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && outcome) onDismiss(); }}>
      <DialogContent hideClose aria-describedby="ev-desc"
        onEscapeKeyDown={e => { if (!outcome) e.preventDefault(); }}
        onPointerDownOutside={e => e.preventDefault()}
        className={cn('max-w-[760px]', crit ? 'border-critical/50 shadow-[0_40px_120px_-20px_rgba(255,107,120,.25)]' : 'border-warning/45 shadow-[0_40px_120px_-20px_rgba(255,198,109,.18)]')}>
        <div className={cn('h-[3px]', crit ? 'bg-critical' : 'bg-warning')} />
        <div className="border-b border-line-soft px-6 pb-5 pt-5">
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <span className={cn('flex h-[26px] items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[.12em]', crit ? 'bg-critical/[.12] text-critical' : 'bg-warning/10 text-warning')}>
              {crit ? <OctagonAlert className="size-3.5" /> : <AlertTriangle className="size-3.5" />}{crit ? 'Critical' : 'Warning'}
            </span>
            <span className="label">{ev.kind} · Day {pad2(mission.day)}</span>
          </div>
          <div className="flex items-start gap-3.5">
            <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', crit ? 'bg-critical/[.12] text-critical' : 'bg-warning/10 text-warning')}><SimIcon name={ev.icon} className="size-6" /></span>
            <div>
              <DialogTitle className="mb-2 text-[26px] tracking-[-.02em]">{ev.title}</DialogTitle>
              <DialogDescription id="ev-desc" className="text-[15px]">{ev.situation}</DialogDescription>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {ev.resources.map(k => { const [I, label, v, c] = readouts[k]; return (
              <span key={k} className="flex items-center gap-2 rounded-lg border border-line-soft bg-well px-3 py-2 text-[12.5px]">
                <I className="size-3.5 text-ink-muted" /><span className="text-ink-muted">{label}</span><span className={cn('tnum font-semibold', c)}>{v}</span>
              </span>
            ); })}
          </div>
        </div>

        {!outcome && (
          <>
            <fieldset className="px-6 py-5">
              <legend className="label mb-3">Choose a response</legend>
              <RadioGroup value={choice} onValueChange={setChoice} aria-label="Response options">
                {ev.choices.map(c => (
                  <RadioCard key={c.id} value={c.id} disabled={c.disabled}>
                    <span className="flex w-full items-center gap-3">
                      <RadioDot />
                      <span className="flex-1 text-[15px] font-medium">{c.label}</span>
                      {c.disabled ? <span className="text-[11.5px] text-critical-soft">{c.reason || `Needs ${c.cost} credits`}</span>
                        : ev.advice?.status === 'ready' && ev.advice.recommend === c.id ? <span className="text-[11.5px] font-semibold text-cyan">★ Mission Control recommends</span> : null}
                    </span>
                    <span className="flex flex-wrap gap-1.5 pl-[30px]">
                      {c.preview.map(p => (
                        <span key={p.label} className={cn('flex h-6 items-center gap-1.5 rounded-md px-2 text-xs', TONE[p.tone])}>
                          <span className="text-ink-muted">{p.label}</span><span className="font-semibold">{p.value}</span>
                        </span>
                      ))}
                    </span>
                  </RadioCard>
                ))}
              </RadioGroup>
            </fieldset>
            <Collapsible className="mx-6 mb-4 rounded-[10px] border border-line-soft bg-well">
              <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3.5 py-3 text-[13px] font-medium text-cyan">
                <FlaskConical className="size-[15px]" /><span className="flex-1 text-left">The science behind this event</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3.5 pb-3.5 text-[13px] leading-relaxed text-ink-2">
                <p className="mb-2.5">{ev.science}</p>
              </CollapsibleContent>
            </Collapsible>
            <AdvicePanel mission={mission} event={ev} />
            <div className="flex flex-wrap items-center gap-3 border-t border-line-soft px-6 py-4">
              <span className="flex-1 text-xs text-ink-faint">Consequences are calculated by the simulation engine. Previews show known effects.</span>
              <Button disabled={!choice} onClick={() => onConfirm(choice)} className="h-[46px] px-5 tracking-[.05em]"><Check />CONFIRM DECISION</Button>
            </div>
          </>
        )}

        {outcome && O && (
          <>
            <div role="status" className={cn('flex items-start gap-3.5 px-6 py-6', O.bg)}>
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-full border-[1.5px]', O.border, O.text)}><O.icon className="size-5" /></span>
              <div>
                <div className={cn('label mb-2 font-semibold', O.text)}>{O.label}</div>
                <h3 className="mb-1.5 text-xl font-semibold">{outcome.title}</h3>
                <p className="text-sm leading-relaxed text-ink-2">{outcome.text}</p>
              </div>
            </div>
            <div className="flex justify-end border-t border-line-soft px-6 py-4">
              <Button onClick={onDismiss} autoFocus>Return to Mission Control <ArrowRight /></Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
