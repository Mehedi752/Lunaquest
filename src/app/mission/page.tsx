'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMissionCtx } from '@/components/lq/mission/shell';
import { OperationsPanel } from '@/components/lq/mission/operations-panel';
import { DecisionPanel, OutpostScene, ResourceStrip, SystemsList, Telemetry, type ModuleId } from '@/components/lq/mission/control-v2';
import { daysOf } from '@/lib/sim';

/** Mission Control v2: the outpost scene is the centerpiece, flanked by system status and the decision panel. */
export default function OverviewPage() {
  const router = useRouter();
  const { mission: m, R, A, requestAdvance, blocked } = useMissionCtx();
  const [sel, setSel] = useState<ModuleId>('hab');
  const [w, setW] = useState(1440);
  useEffect(() => { const f = () => setW(window.innerWidth); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const wide = w >= 1280, mid = w >= 900;
  const N = daysOf(m), active = m.status === 'active';
  const advText = !active ? 'MISSION ENDED' : m.pendingEvent ? 'CHOOSE A RESPONSE FIRST' : `NEXT DAY → DAY ${String(Math.min(m.day + 1, N)).padStart(2, '0')}`;
  const pick = (id: ModuleId) => setSel(id);
  const upgrade = (id: string) => router.push(`/mission/build?system=${id}`);

  return (
    <div className="-m-4 flex flex-col">
      <ResourceStrip m={m} R={R} selected={sel} onSelect={pick} />
      <OperationsPanel m={m} locked={!!m.pendingEvent} />
      <div className="grid gap-3 p-3" style={{ gridTemplateColumns: wide ? '280px minmax(0,1fr) 340px' : mid ? 'minmax(0,1fr) 320px' : 'minmax(0,1fr)' }}>
        <div style={{ order: wide ? 0 : 2, gridColumn: wide || !mid ? undefined : '1 / -1' }}><SystemsList m={m} R={R} selected={sel} onSelect={pick} /></div>
        <main aria-label="Outpost" className="flex min-w-0 flex-col gap-3" style={{ order: wide ? 1 : 0 }}>
          <OutpostScene m={m} R={R} selected={sel} onSelect={pick} onAdvance={requestAdvance} canAdvance={active && !blocked} advanceText={advText} />
          <Telemetry m={m} />
        </main>
        <div style={{ order: wide ? 2 : 1 }}><DecisionPanel m={m} R={R} A={A} selected={sel} onUpgrade={upgrade} /></div>
      </div>
    </div>
  );
}
