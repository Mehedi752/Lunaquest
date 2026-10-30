'use client';

import { Clock, Orbit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/lib/store';
import { COMMS, daysOf, type EventView, type MissionState } from '@/lib/sim';
import { cn } from '@/lib/utils';

/** Ask Mission Control on Earth. At Moon distance the reply arrives after the real ~2.6 s round trip;
 *  in the Mars-distance drill it arrives tomorrow (decide alone, or wait a day). */
export function AdvicePanel({ mission: m, event: ev }: { mission: MissionState; event: EventView }) {
  const askEarth = useMissionStore(s => s.askEarth), waitEarth = useMissionStore(s => s.waitEarth);
  const mode = m.comms ?? 'moon', CM = COMMS[mode], A = ev.advice ?? null;
  let body = CM.note, tone = 'text-ink-2';
  if (A?.status === 'transit') body = 'Your question is travelling to Earth at the speed of light… and the answer is on its way back.';
  else if (A?.status === 'waiting') body = m.day < daysOf(m)
    ? 'Your question is on its way. At Mars distance the reply arrives tomorrow. Decide now on your own — or wait one day, which uses a day of air, water, food and power.'
    : 'It is the last day, so the reply would arrive too late. Decide on your own.';
  else if (A?.status === 'ready') { body = `Mission Control says: ${A.text}`; tone = 'text-ink'; }
  return (
    <div className={cn('mx-6 mb-4 flex flex-col gap-2.5 rounded-xl border bg-well px-4 py-3.5', A?.status === 'ready' ? 'border-cyan/45' : A?.status === 'waiting' ? 'border-warning/45' : 'border-line')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Orbit className="size-4 text-cyan" /><span className="label text-cyan">Mission Control · Earth</span>
        <span className="font-mono text-[11px] text-ink-muted">{CM.label.toUpperCase()} · {CM.delayText}</span>
      </div>
      <p aria-live="polite" className={cn('text-sm leading-relaxed', tone)}>{body}</p>
      {A?.status === 'transit' && (
        <div role="progressbar" aria-label="Signal travelling to Earth and back" className="h-1.5 overflow-hidden rounded-full bg-[#172235]">
          <div className="h-full origin-left animate-[lqSignal_linear_forwards] bg-cyan" style={{ animationDuration: `${CM.roundTripSec ?? 2.6}s` }} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!A && <Button variant="outline" onClick={askEarth} className="h-9 gap-2 border-cyan text-cyan"><Orbit className="size-4" />{mode === 'mars' ? 'Ask for advice (reply tomorrow)' : 'Ask for advice'}</Button>}
        {A?.status === 'waiting' && m.day < daysOf(m) && <Button variant="outline" onClick={waitEarth} className="h-9 gap-2 border-warning text-warning"><Clock className="size-4" />Wait one day for the reply</Button>}
      </div>
    </div>
  );
}
