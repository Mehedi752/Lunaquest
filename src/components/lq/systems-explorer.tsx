'use client';

import { useState } from 'react';
import { ChevronRight, Shield, Sprout, Wind, Droplets, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const SYSTEMS = [
  { icon: Wind, name: 'Life support', tag: 'Oxygen', question: 'Where does the crew’s air come from when there is no atmosphere?',
    game: 'An oxygen generator splits water by electrolysis. Without one, the crew lives off a finite tank that lasts about 18 days.',
    real: 'Space station life support controls oxygen levels, pressure, ventilation and fire safety, and recycles much of its water.', tradeoff: 'More oxygen means more water and power used.' },
  { icon: Droplets, name: 'Water recycling', tag: 'Water', question: 'Can a sealed habitat reuse the same water over and over?',
    game: 'Recyclers recover 75–95% of used water depending on level. The rest is lost each day — recycling slows decline, it never stops it.',
    real: 'The International Space Station’s Water Recovery System recycles about 98% of its water, including humidity and urine.', tradeoff: 'Recyclers need steady power.' },
  { icon: Zap, name: 'Energy', tag: 'Power', question: 'What happens to a solar-powered base when the Sun disappears behind a ridge?',
    game: 'Arrays generate power in sunlight and batteries store the surplus. When both run short, the outpost sheds loads — greenhouse first, life support last.',
    real: 'A lunar night lasts about 14.5 Earth days, which is why NASA is studying fission power that works independently of the Sun.', tradeoff: 'Batteries store energy but generate none.' },
  { icon: Sprout, name: 'Food production', tag: 'Food', question: 'Can astronauts grow enough to eat?',
    game: 'The greenhouse needs power and water, and gives nothing until its first harvest on day 8. It supplements packaged food rather than replacing it.',
    real: 'NASA’s Veggie garden on the space station has grown lettuces, cabbage, kale and flowers under LED light.', tradeoff: 'Slow payoff and vulnerable to faults.' },
  { icon: Shield, name: 'Radiation protection', tag: 'Radiation', question: 'How do you protect a crew from a solar storm on the Moon?',
    game: 'Shielding sets how much of a storm’s hazard reaches the crew. Exposure is an abstract risk index, not a real radiation dose.',
    real: 'Artemis crews can build a storm shelter by moving mass around them, guided by forecasts and onboard sensors.', tradeoff: 'Costly, and idle until a storm arrives.' },
];

export function SystemsExplorer() {
  const [i, setI] = useState(0);
  const s = SYSTEMS[i];
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div role="tablist" aria-label="Resource systems" className="flex flex-col gap-2">
        {SYSTEMS.map((x, j) => (
          <button key={x.name} role="tab" aria-selected={i === j} aria-controls="sys-panel" onClick={() => setI(j)}
            className={cn('flex items-center gap-3.5 rounded-xl border px-4 py-4 text-left transition-colors hover:border-[#3A4E6B]',
              i === j ? 'border-cyan bg-elevated' : 'border-line-soft')}>
            <x.icon className={cn('size-5', i === j ? 'text-cyan' : 'text-ink-muted')} />
            <span className="flex-1 font-medium">{x.name}</span>
            <ChevronRight className="size-4 text-ink-faint" />
          </button>
        ))}
      </div>
      <div id="sys-panel" role="tabpanel" className="flex min-w-0 flex-col gap-7 rounded-2xl border border-line bg-gradient-to-b from-[#0F1726] to-surface p-6 md:p-10 lg:col-span-2">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-xl border border-cyan/25 bg-cyan/[.08] text-cyan"><s.icon className="size-6" /></span>
          <div><div className="label mb-1.5">{s.tag}</div><h3 className="text-[26px] font-semibold tracking-[-.015em]">{s.name}</h3></div>
        </div>
        <p className="max-w-2xl text-lg leading-relaxed text-[#DCE4EF] text-pretty">{s.question}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-well p-4"><div className="label mb-2.5 text-cyan">In the game</div><p className="text-[15px] leading-relaxed text-ink-2">{s.game}</p></div>
          <div className="rounded-xl border border-line bg-well p-4"><div className="label mb-2.5 text-success">In reality</div><p className="text-[15px] leading-relaxed text-ink-2">{s.real}</p></div>
        </div>
        <p className="text-[13px] text-ink-muted">Key trade-off: <span className="text-ink">{s.tradeoff}</span></p>
      </div>
    </div>
  );
}
