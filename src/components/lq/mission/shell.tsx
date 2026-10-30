'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Award, ChevronRight, FlaskConical, History, OctagonAlert, Wrench } from 'lucide-react';
import { MissionTopbar, type Speed } from './topbar';
import { MissionNav } from './nav';
import { EventDialog } from './event-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useEnsureMission } from '@/hooks/use-mission';
import { useMissionStore } from '@/lib/store';
import { GoalBar, HowToPlay } from './guide';
import { alerts, eventView, resources, type Alert, type MissionState, type Outcome, type ResourceView } from '@/lib/sim';
import { cn } from '@/lib/utils';

interface Ctx { mission: MissionState; R: ResourceView; A: Alert[]; requestAdvance: () => void; blocked: boolean }
const MissionCtx = createContext<Ctx | null>(null);
export function useMissionCtx() {
  const c = useContext(MissionCtx);
  if (!c) throw new Error('useMissionCtx must be used within <MissionShell>');
  return c;
}

export function MissionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [help, setHelp] = useState(false);
  const mission = useEnsureMission();
  const advance = useMissionStore(s => s.advance);
  const resolve = useMissionStore(s => s.resolve);
  const restart = useMissionStore(s => s.restart);

  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(2500);
  const [confirm, setConfirm] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [endSeen, setEndSeen] = useState(false);

  const derived = useMemo(() => (mission ? { R: resources(mission), A: alerts(mission), E: eventView(mission) } : null), [mission]);
  const critical = derived?.A.filter(a => a.level === 'critical') ?? [];
  const active = mission?.status === 'active';
  const blocked = !active || !!mission?.pendingEvent;

  const doAdvance = useCallback(() => {
    const next = advance();
    setConfirm(false);
    if (next && (next.pendingEvent || next.status !== 'active')) setRunning(false);
  }, [advance]);

  const requestAdvance = useCallback(() => {
    if (blocked) return;
    if (critical.length) { setRunning(false); setConfirm(true); return; }
    doAdvance();
  }, [blocked, critical.length, doAdvance]);

  // Auto-advance: simulation time only moves via explicit ticks; pauses on events, critical alerts and dialogs.
  const reqRef = useRef(requestAdvance); reqRef.current = requestAdvance;
  useEffect(() => {
    if (!running || blocked || confirm || outcome || help) return;
    const t = setTimeout(() => reqRef.current(), speed);
    return () => clearTimeout(t);
  }, [running, blocked, confirm, outcome, help, speed, mission?.day]);

  // Tutorial gate: must run before the loading early-return so the hook order never changes.
  useEffect(() => { try { if (localStorage.getItem('lunaquest.tutorialDone') !== '1') { setHelp(true); setRunning(false); } } catch {} }, []);

  if (!mission || !derived) {
    return <div className="grid min-h-screen place-items-center"><div className="label animate-pulse">Loading telemetry…</div></div>;
  }

  const ended = mission.status !== 'active';
  const showEnd = ended && !outcome && !endSeen && path !== '/mission/debrief';

  const closeHelp = () => { try { localStorage.setItem('lunaquest.tutorialDone', '1'); } catch {} setHelp(false); };

  return (
    <MissionCtx.Provider value={{ mission, R: derived.R, A: derived.A, requestAdvance, blocked }}>
      <div className="flex min-h-screen flex-col">
        <MissionTopbar mission={mission} alerts={derived.A} running={running} onToggleRun={() => setRunning(r => !r && active)}
          speed={speed} onSpeed={setSpeed} onRestart={() => { restart(); setRunning(false); setOutcome(null); setEndSeen(false); }} />
        <GoalBar m={mission} onHelp={() => { setHelp(true); setRunning(false); }} />
        <HowToPlay m={mission} open={help} onClose={closeHelp} />
        <div className="flex min-h-0 flex-1">
          <MissionNav variant="rail" />
          <div className="flex min-w-0 flex-1 flex-col">
            <MissionNav variant="strip" />
            <div className="flex-1 p-4">{children}</div>

            <div role="toolbar" aria-label="Mission controls" className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t border-line-soft bg-well/95 px-4 py-3 backdrop-blur">
              <Link href="/mission/timeline" className={cn(buttonVariants({ variant: 'secondary' }), path === '/mission/timeline' && 'border-cyan')}><History />Review Decisions</Link>
              <Link href="/mission/build" className={cn(buttonVariants({ variant: 'secondary' }), path === '/mission/build' && 'border-cyan')}><Wrench />Manage Outpost</Link>
              <Link href="/science" className={buttonVariants({ variant: 'secondary' })}><FlaskConical />Science Lab</Link>
              <div className="flex-1" />
              <span className="max-w-[300px] text-xs leading-snug text-ink-muted">
                {ended ? 'The mission has ended.' : mission.pendingEvent ? 'Resolve the active emergency first.' : 'Advancing consumes a day of oxygen, water, food and power — and may trigger events.'}
              </span>
              {ended ? (
                <Link href="/mission/debrief" className={cn(buttonVariants({ size: 'lg' }), 'h-12')}><Award />VIEW DEBRIEF</Link>
              ) : (
                <Button size="lg" className="h-12 tracking-[.05em]" disabled={blocked} onClick={requestAdvance}><ChevronRight />ADVANCE ONE DAY</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventDialog mission={mission} event={derived.E} R={derived.R} outcome={outcome}
        onConfirm={id => { const n = resolve(id); if (n?.lastOutcome) setOutcome(n.lastOutcome); }}
        onDismiss={() => setOutcome(null)} />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-critical"><OctagonAlert className="size-[22px]" /><span className="label font-semibold text-critical">Critical system warning</span></div>
            <AlertDialogTitle>Advance with a system in danger?</AlertDialogTitle>
            <AlertDialogDescription>Advancing will consume another day of resources. These systems are already critical:</AlertDialogDescription>
            <ul className="flex flex-col gap-1.5">
              {critical.map(c => <li key={c.title} className="flex gap-2 rounded-lg bg-critical/[.08] px-3 py-2.5 text-[13px]"><OctagonAlert className="size-[15px] shrink-0 text-critical" />{c.title}. {c.text}</li>)}
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/mission')}>Review outpost first</AlertDialogCancel>
            <AlertDialogAction onClick={doAdvance}>Advance anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEnd} onOpenChange={o => !o && setEndSeen(true)}>
        <DialogContent className={cn('max-w-[520px] px-7 py-9 text-center', mission.status === 'complete' ? 'border-success' : 'border-critical')}>
          {mission.status === 'complete' ? (
            <>
              <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-[1.5px] border-success text-success"><Award className="size-[30px]" /></span>
              <div className="label mb-2.5 font-semibold tracking-[.16em] text-success">Mission complete</div>
              <DialogTitle className="mb-2.5 text-[28px] tracking-[-.02em]">Thirty days. Crew safe.</DialogTitle>
              <DialogDescription className="mb-6 text-[15px]">Lunar Outpost Alpha completed its mission with {mission.objectives.filter(o => o.done).length} of 5 science objectives.</DialogDescription>
            </>
          ) : (
            <>
              <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-[1.5px] border-critical text-critical"><OctagonAlert className="size-[30px]" /></span>
              <div className="label mb-2.5 font-semibold tracking-[.16em] text-critical">Mission aborted</div>
              <DialogTitle className="mb-2.5 text-[28px] tracking-[-.02em]">{mission.failure?.system} failure on day {mission.failure?.day}</DialogTitle>
              <DialogDescription className="mb-6 text-[15px]">{mission.failure?.text}</DialogDescription>
            </>
          )}
          <Link href="/mission/debrief" className={cn(buttonVariants({ size: 'lg' }), 'mx-auto h-12')}>VIEW MISSION DEBRIEF <ArrowRight /></Link>
        </DialogContent>
      </Dialog>
    </MissionCtx.Provider>
  );
}
