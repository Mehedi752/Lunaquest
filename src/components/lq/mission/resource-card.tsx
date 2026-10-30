'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { STATUS, StatusLabel } from '@/components/lq/status';
import { Progress } from '@/components/ui/progress';
import type { IconName, ResourceReading } from '@/lib/sim';
import { SimIcon } from '@/components/lq/icons';
import { cn, f0, f1, pct, signed } from '@/lib/utils';

export function trend(net: number, days: number) {
  if (net > .05) return { Icon: TrendingUp, text: `Rising · ${signed(net)}/day`, cls: 'text-success' };
  if (net < -.05) {
    const left = isFinite(days) ? `${Math.max(0, Math.floor(days))} days left` : 'Not declining';
    return { Icon: TrendingDown, text: `Falling · ${left}`, cls: days < 4 ? 'text-critical' : days < 9 ? 'text-warning' : 'text-ink-muted' };
  }
  return { Icon: Minus, text: 'Holding steady', cls: 'text-ink-muted' };
}

export function ResourceCard({ id, name, icon, r, rows, onInspect }: {
  id: string; name: string; icon: IconName; r: ResourceReading; rows: [string, string][]; onInspect?: () => void;
}) {
  const S = STATUS[r.status];
  const p = pct(r.value, r.cap);
  const T = trend(r.net, r.days);
  return (
    <article aria-labelledby={id} onClick={onInspect}
      className={cn('flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-surface px-4 py-3.5 transition-colors hover:border-[#3A4E6B]', S.border)}>
      <div className="flex items-center gap-2">
        <SimIcon name={icon} className="text-ink-muted" />
        <h3 id={id} className="label flex-1 text-ink-2">{name}</h3>
        <StatusLabel status={r.status} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="tnum text-[30px] font-semibold tracking-[-.02em]">{r.value >= 100 ? f0(r.value) : f1(r.value)}</span>
        <span className="tnum text-[13px] text-ink-muted">/ {f0(r.cap)} {r.unit} max</span>
      </div>
      <Progress value={p} ticks={[10, 25]} indicatorClassName={S.fill} aria-label={`${name} ${Math.round(p)} percent of capacity`} />
      <dl className="grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-1 text-[12.5px]">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-ink-muted">{k}</dt><dd className="tnum text-right">{v}</dd></div>)}
      </dl>
      <div className={cn('flex items-center gap-1.5 border-t border-line-faint pt-2 text-xs', T.cls)}><T.Icon className="size-3.5" />{T.text}</div>
    </article>
  );
}
