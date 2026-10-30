'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Save, OctagonAlert, AlertTriangle, Pause, Play, RotateCcw, Settings2, Users, Wrench, X } from 'lucide-react';
import { Emblem } from '@/components/lq/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/primitives';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { daysOf, type Alert, type MissionState } from '@/lib/sim';
import { useMissionStore } from '@/lib/store';
import { cn, pad2 } from '@/lib/utils';

export type Speed = 4000 | 2500 | 1200;

const TOP = {
  event: ['Emergency', 'text-critical border-critical/40 bg-critical/10', OctagonAlert],
  critical: ['Critical', 'text-critical border-critical/40 bg-critical/10', OctagonAlert],
  warning: ['Caution', 'text-warning border-warning/40 bg-warning/10', AlertTriangle],
  stable: ['Nominal', 'text-success border-success/40 bg-success/10', CheckCircle2],
  complete: ['Complete', 'text-cyan border-cyan/40 bg-cyan/10', Award],
  failed: ['Aborted', 'text-critical border-critical/40 bg-critical/10', X],
} as const;

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now ? `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}` : '--:--:--';
}

export function MissionTopbar({ mission, alerts, running, onToggleRun, speed, onSpeed, onRestart }: {
  mission: MissionState; alerts: Alert[]; running: boolean; onToggleRun: () => void; speed: Speed; onSpeed: (s: Speed) => void; onRestart: () => void;
}) {
  const clock = useClock(), N = daysOf(mission), setComms = useMissionStore(s => s.setCommsMode);
  const worst = mission.pendingEvent ? 'event' : mission.status !== 'active' ? mission.status
    : alerts.some(a => a.level === 'critical') ? 'critical' : alerts.length ? 'warning' : 'stable';
  const [label, cls, Icon] = TOP[worst];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-[clamp(10px,2vw,24px)] overflow-x-auto border-b border-line-soft bg-well px-4">
      <Link href="/" aria-label="LunaQuest home" className="flex shrink-0 items-center gap-2 text-ink"><Emblem size={26} /><span className="hidden text-[15px] font-semibold sm:inline">LunaQuest</span></Link>
      <span className="hidden h-6 w-px shrink-0 bg-line xl:block" />
      <div className="hidden shrink-0 flex-col gap-1 xl:flex"><span className="label text-[10px] text-ink-faint">Mission</span><span className="whitespace-nowrap text-[13px] font-medium">{mission.mission}</span></div>
      <div className="flex shrink-0 flex-col gap-1">
        <span className="label text-[10px] text-ink-faint">Sim day</span>
        <span className="tnum flex items-center gap-2 text-[13px] font-semibold">Day {pad2(mission.day)} / {N}
          <span className="h-1 w-11 overflow-hidden rounded-sm bg-line-soft"><span className="block h-full bg-cyan" style={{ width: `${(mission.day / N) * 100}%` }} /></span>
        </span>
      </div>
      <div className="flex shrink-0 flex-col gap-1"><span className="label text-[10px] text-ink-faint">Crew</span><span className="flex items-center gap-1.5 text-[13px] font-medium"><Users className="size-3.5" />4</span></div>
      <span role="status" className={cn('flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-mono text-[11px] font-medium uppercase tracking-[.12em]', cls)}>
        <Icon className="size-3.5" />{label}
      </span>
      <div className="flex-1" />
      <div title="Operations clock — real time, display only. It does not affect the simulation." className="hidden shrink-0 flex-col gap-1 text-right md:flex">
        <span className="label text-[10px] text-ink-faint">Ops clock UTC</span>
        <span className="tnum font-mono text-[13px] text-ink-2">{clock}</span>
      </div>
      <Button variant="secondary" size="sm" onClick={onToggleRun} aria-pressed={running} disabled={mission.status !== 'active'}
        title={running ? 'Pause auto-advance' : 'Auto-advance one day every few seconds'}
        className={cn('h-[34px] shrink-0 text-xs', running && 'border-cyan text-cyan')}>
        {running ? <Pause /> : <Play />}{running ? 'Pause' : 'Auto'}
      </Button>
      <span title="Progress is saved in this browser" className="flex shrink-0 items-center gap-1.5 text-xs text-ink-muted"><Save className="size-4" /><span className="hidden xl:inline">Saved</span></span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" aria-label="Settings" className="shrink-0"><Settings2 /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Auto-advance speed</DropdownMenuLabel>
          <ToggleGroup type="single" value={String(speed)} onValueChange={v => v && onSpeed(Number(v) as Speed)} className="mx-2 mb-2">
            <ToggleGroupItem value="4000" className="flex-1">Slow</ToggleGroupItem>
            <ToggleGroupItem value="2500" className="flex-1">Normal</ToggleGroupItem>
            <ToggleGroupItem value="1200" className="flex-1">Fast</ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenuLabel>Communication delay</DropdownMenuLabel>
          <ToggleGroup type="single" value={mission.comms ?? 'moon'} onValueChange={v => v && setComms(v as 'moon' | 'mars')} className="mx-2 mb-1">
            <ToggleGroupItem value="moon" className="flex-1">Moon (1.3 s)</ToggleGroupItem>
            <ToggleGroupItem value="mars" className="flex-1">Mars drill</ToggleGroupItem>
          </ToggleGroup>
          <p className="mx-3 mb-2 max-w-[230px] text-[11.5px] leading-snug text-ink-muted">{(mission.comms ?? 'moon') === 'mars' ? 'Earth’s reply arrives the next day — decide alone or wait.' : 'Help from Mission Control arrives in about 3 seconds.'}</p>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/missions/lunar-alpha/configure" className="text-ink"><Wrench />Reconfigure &amp; restart</Link></DropdownMenuItem>
          <DropdownMenuItem onSelect={onRestart} className="text-critical-soft"><RotateCcw />Restart mission (same setup)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
