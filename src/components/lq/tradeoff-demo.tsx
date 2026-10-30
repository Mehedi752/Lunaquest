'use client';

import { useState } from 'react';
import { Battery, Info, Shield, Sprout } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

type Key = 'shield' | 'battery' | 'food';
const TOTAL = 60;

/** Landing section B — a fixed 60-credit budget shared between three systems. */
export function TradeoffDemo() {
  const [a, setA] = useState<Record<Key, number>>({ shield: 20, battery: 20, food: 20 });

  const set = (key: Key, v: number) => {
    const next = { ...a, [key]: v };
    const others = (Object.keys(a) as Key[]).filter(k => k !== key);
    const sum = others.reduce((t, k) => t + a[k], 0);
    const first = Math.round(((sum ? a[others[0]] / sum : .5) * (TOTAL - v)) / 5) * 5;
    next[others[0]] = Math.max(0, first);
    next[others[1]] = Math.max(0, TOTAL - v - next[others[0]]);
    setA(next);
  };
  const band = (v: number) => (v >= 30 ? 'text-success' : v >= 15 ? 'text-warning' : 'text-critical');
  const dot = (v: number) => (v >= 30 ? 'bg-success' : v >= 15 ? 'bg-warning' : 'bg-critical');
  const rows = [
    { key: 'shield' as const, icon: Shield, label: 'Radiation shielding', metric: 'Storm exposure risk', result: a.shield >= 30 ? 'Low' : a.shield >= 15 ? 'Moderate' : 'High' },
    { key: 'battery' as const, icon: Battery, label: 'Battery storage', metric: 'Shadow-period endurance', result: `${(1 + a.battery / 10).toFixed(1)} days` },
    { key: 'food' as const, icon: Sprout, label: 'Food production', metric: 'Food grown on site', result: `${Math.min(80, Math.round(a.food * 1.4))}% of demand` },
  ];
  const weakest = [...rows].sort((x, y) => a[x.key] - a[y.key])[0];
  const verdict = rows.every(r => a[r.key] >= 15)
    ? 'A spread-out plan avoids any single weak point — but nothing is strong. One bad event could still push a system into the red.'
    : `Your ${weakest.label.toLowerCase()} is underfunded. That is a legitimate gamble — until the event that tests it arrives.`;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-5 md:p-8">
      {rows.map(r => (
        <div key={r.key} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[9px] border border-line bg-elevated text-cyan"><r.icon className="size-[18px]" /></span>
            <label id={`l-${r.key}`} className="flex-1 font-medium">{r.label}</label>
            <span className="tnum font-semibold">{a[r.key]} <span className="font-normal text-ink-muted">cr</span></span>
          </div>
          <Slider aria-labelledby={`l-${r.key}`} min={0} max={TOTAL} step={5} value={[a[r.key]]} onValueChange={([v]) => set(r.key, v)} />
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-ink-muted">{r.metric}</span>
            <span className={`flex items-center gap-1.5 font-medium ${band(a[r.key])}`}><span className={`size-[7px] rounded-sm ${dot(a[r.key])}`} />{r.result}</span>
          </div>
        </div>
      ))}
      <p aria-live="polite" className="flex items-start gap-3 border-t border-line pt-4 text-sm leading-relaxed text-ink-2">
        <Info className="mt-0.5 size-[18px] shrink-0 text-warning" />{verdict}
      </p>
    </div>
  );
}
