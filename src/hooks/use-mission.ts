'use client';

import { useEffect, useMemo } from 'react';
import { alerts, resources, type MissionState } from '@/lib/sim';
import { useHydrated, useMissionStore } from '@/lib/store';

/** Ensures a mission exists after hydration. Returns null until ready. */
export function useEnsureMission(): MissionState | null {
  const hydrated = useHydrated();
  const mission = useMissionStore(s => s.mission);
  const ensure = useMissionStore(s => s.ensureMission);
  useEffect(() => { if (hydrated && !mission) ensure(); }, [hydrated, mission, ensure]);
  return hydrated ? mission : null;
}

/** For pages rendered inside <MissionShell>, which guarantees a mission. */
export function useMission(): MissionState {
  const m = useMissionStore(s => s.mission);
  if (!m) throw new Error('useMission must be used inside <MissionShell>');
  return m;
}

export function useDerived(m: MissionState) {
  return useMemo(() => ({ R: resources(m), A: alerts(m) }), [m]);
}
