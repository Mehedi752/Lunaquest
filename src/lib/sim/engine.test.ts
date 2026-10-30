import { describe, expect, it } from 'vitest';
import {
  PRESETS, advanceDay, bonusExperiment, configCost, eventView, newMission, purchase, receiveAdvice, requestAdvice,
  resolveEvent, score, setComms, setPower, waitForReply, P, CAPS,
} from './index';
import type { MissionState } from './types';

const B = PRESETS.balanced;
const play = (s: MissionState, pick?: (id: string) => string | null) => {
  for (let g = 0; s.status === 'active' && g < 200; g++) {
    const v = eventView(s);
    s = v ? resolveEvent(s, (pick && pick(v.id)) || v.choices[0].id) : advanceDay(s);
  }
  return s;
};
const toStorm = (s: MissionState) => { while (s.pendingEvent !== 'storm' && s.status === 'active') s = s.pendingEvent ? resolveEvent(s, eventView(s)!.choices[0].id) : advanceDay(s); return s; };

describe('configuration', () => {
  it('level 1 of every system exceeds the budget', () => {
    expect(configCost({ solar: 1, battery: 1, shielding: 1, recycler: 1, greenhouse: 1, oxygen: 1, reserves: 1 })).toBe(105);
  });
  it('credits = scenario budget − cost', () => {
    expect(newMission(B).credits).toBe(100 - configCost(B));
    expect(newMission(B, { scenario: 'night' }).credits).toBe(120 - configCost(B));
  });
  it('purchase rejects when unaffordable', () => {
    const s = { ...newMission(B), credits: 0 };
    expect(purchase(s, 'solar')).toBe(s);
  });
});

describe('random emergencies', () => {
  it('same seed → same schedule; different seeds differ', () => {
    const sig = (seed: number) => JSON.stringify(newMission(B, { seed }).schedule);
    expect(sig(11)).toBe(sig(11));
    expect(new Set(Array.from({ length: 25 }, (_, k) => sig(k + 1))).size).toBeGreaterThanOrEqual(20);
  });
  it('storms are forecast 2–3 days ahead; every mission has a real storm', () => {
    for (let k = 1; k <= 40; k++) {
      const sc = newMission(B, { seed: k }).schedule!;
      sc.filter(e => e.id === 'storm').forEach(e => expect(e.day - e.forecastFrom!).toBeGreaterThanOrEqual(2));
      expect(sc.some(e => e.id === 'storm' && !e.falseAlarm)).toBe(true);
    }
  });
  it('time cannot advance during an emergency', () => {
    let s = newMission(B); while (!s.pendingEvent) s = advanceDay(s);
    expect(advanceDay(s)).toBe(s);
  });
});

describe('mechanics', () => {
  it('day-1 water balance includes electrolysis', () => {
    const s0 = newMission(B), s1 = advanceDay(s0);
    expect(s1.water - s0.water).toBeCloseTo(-(12 - 12 * P.recRate[1]) - P.ghWater - P.o2Gen[1] * P.electrolysis, 6);
  });
  it('resources stay within capacity', () => {
    play(newMission(PRESETS.risky)).history.forEach(h => {
      expect(h.o2).toBeGreaterThanOrEqual(0); expect(h.o2).toBeLessThanOrEqual(CAPS.o2);
      expect(h.water).toBeLessThanOrEqual(CAPS.water);
    });
  });
  it('research switch saves power and stops science', () => {
    let s = setPower(newMission(B), 'research', false); const p0 = s.objectives[0].progress;
    s = advanceDay(s); expect(s.objectives[0].progress).toBe(p0);
  });
  it('bonus experiment spends oxygen once per day', () => {
    const s0 = newMission(B), s1 = bonusExperiment(s0);
    expect(s0.o2 - s1.o2).toBeCloseTo(2.5, 6); expect(bonusExperiment(s1)).toBe(s1);
  });
  it('reinforced shelter blocks more but spends battery', () => {
    const s = toStorm(newMission(B)), a = resolveEvent(s, 'reinforce'), c = resolveEvent(s, 'shelter');
    expect(a.exposure).toBeLessThan(c.exposure); expect(a.battery).toBeLessThan(s.battery);
  });
  it('Moon advice arrives; Mars advice costs a day', () => {
    let s = newMission(B); while (!s.pendingEvent) s = advanceDay(s);
    expect(receiveAdvice(requestAdvice(s)).advice!.status).toBe('ready');
    const m = waitForReply(requestAdvice(setComms(s, 'mars')));
    expect(m.day).toBe(s.day + 1); expect(m.pendingEvent).toBeTruthy();
  });
  it('score categories sum to total', () => {
    const sc = score(play(newMission(B)));
    expect(sc.cats.reduce((a, c) => a + c.value, 0)).toBe(sc.total);
  });
});
