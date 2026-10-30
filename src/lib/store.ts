'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import {
  COMMS, PRESETS, SCENARIOS, advanceDay, bonusExperiment, configCost, emptyLevels, newMission, purchase, receiveAdvice,
  requestAdvice, resolveEvent, setComms, setPower, waitForReply,
  type CommsMode, type EquipmentId, type Levels, type MissionState, type PowerKey, type ScenarioId, type SpaceWeather,
} from '@/lib/sim';

interface MissionStore {
  config: Levels;
  scenario: ScenarioId;
  spaceWeather: SpaceWeather | null;
  mission: MissionState | null;
  setConfig: (levels: Levels) => void;
  setScenario: (id: ScenarioId) => void;
  deploy: () => void;
  ensureMission: () => MissionState;
  advance: () => MissionState | null;
  resolve: (choiceId: string) => MissionState | null;
  buy: (id: EquipmentId) => void;
  togglePower: (key: PowerKey, on: boolean) => void;
  bonus: () => void;
  askEarth: () => void;
  waitEarth: () => void;
  setCommsMode: (mode: CommsMode) => void;
  loadSpaceWeather: () => Promise<void>;
  restart: () => void;
}

const seed = () => Date.now() % 9973;
const fits = (L: Levels, id: ScenarioId) => configCost(L) <= SCENARIOS[id].budget;

/** UI-facing store. All consequences come from the pure engine in `@/lib/sim`. */
export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => {
      const apply = (fn: (m: MissionState) => MissionState) => { const m = get().mission; if (!m) return null; const n = fn(m); set({ mission: n }); return n; };
      const fresh = (levels: Levels) => newMission(levels, { scenario: get().scenario, seed: seed(), spaceWeather: get().spaceWeather });
      return {
        config: emptyLevels(),
        scenario: 'outpost',
        spaceWeather: null,
        mission: null,
        setConfig: config => set({ config }),
        setScenario: id => set({ scenario: id, config: fits(get().config, id) ? get().config : emptyLevels() }),
        deploy: () => set({ mission: fresh(get().config) }),
        ensureMission: () => {
          const m = get().mission; if (m) return m;
          const L = Object.values(get().config).some(Boolean) && fits(get().config, get().scenario) ? get().config : PRESETS.balanced;
          const n = fresh(L); set({ mission: n }); return n;
        },
        advance: () => apply(advanceDay),
        resolve: choiceId => apply(m => resolveEvent(m, choiceId)),
        buy: id => { apply(m => purchase(m, id)); },
        togglePower: (key, on) => { apply(m => setPower(m, key, on)); },
        bonus: () => { apply(bonusExperiment); },
        askEarth: () => {
          const n = apply(requestAdvice);
          if (n?.advice?.status === 'transit') setTimeout(() => apply(receiveAdvice), (COMMS.moon.roundTripSec ?? 2.6) * 1000);
        },
        waitEarth: () => { apply(waitForReply); },
        setCommsMode: mode => { apply(m => setComms(m, mode)); },
        loadSpaceWeather: async () => {
          try { const r = await fetch('/api/space-weather'); const sw = (await r.json()) as SpaceWeather; set({ spaceWeather: sw }); }
          catch { set({ spaceWeather: { status: 'curated', tier: 'elevated' } }); }
        },
        restart: () => {
          const m = get().mission, L = Object.values(get().config).some(Boolean) ? get().config : m?.levels ?? PRESETS.balanced;
          set({ mission: newMission(L, { scenario: m?.scenario ?? get().scenario, seed: seed(), spaceWeather: get().spaceWeather, comms: m?.comms }) });
        },
      };
    },
    { name: 'lunaquest.v2', version: 2, storage: createJSONStorage(() => localStorage), skipHydration: true,
      partialize: s => ({ config: s.config, scenario: s.scenario, mission: s.mission, spaceWeather: s.spaceWeather }) as unknown as MissionStore },
  ),
);

/** Rehydrate persisted state on the client; returns true once storage has been read. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useMissionStore.persist.onFinishHydration(() => setHydrated(true));
    if (useMissionStore.persist.hasHydrated()) setHydrated(true);
    else useMissionStore.persist.rehydrate();
    return unsub;
  }, []);
  return hydrated;
}
