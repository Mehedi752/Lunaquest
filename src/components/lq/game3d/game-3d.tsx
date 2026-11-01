'use client';

import { useEffect, useRef } from 'react';
import LQSim from '@/lib/sim/core';
import { useHydrated, useMissionStore } from '@/lib/store';
import type { Levels, MissionState, ScenarioId } from '@/lib/sim';

declare global {
  interface Window { LQSim?: unknown; LQData?: unknown }
}

/** Engine bridge: the 3D view uses the same engine and the same saved mission as /mission (Zustand store). */
function installBridge() {
  const store = useMissionStore;
  const core = LQSim as any;
  window.LQSim = {
    ...core,
    load: (): MissionState | null => store.getState().mission,
    save: (s: MissionState) => { store.setState({ mission: s }); return s; },
    ensure: () => store.getState().ensureMission(),
    loadConfig: (): Levels | null => { const c = store.getState().config; return Object.values(c).some(Boolean) ? c : null; },
    saveConfig: (levels: Levels) => store.getState().setConfig(levels),
    loadScenario: (): ScenarioId => store.getState().scenario,
    saveScenario: (id: ScenarioId) => { core.saveScenario(id); store.getState().setScenario(id); },
  };
  window.LQData = {
    getSpaceWeather: () => store.getState().loadSpaceWeather().then(() => store.getState().spaceWeather),
    peek: () => store.getState().spaceWeather,
  };
}

/** The canvas text and HUD use the Geist family by name, so load it by name once. */
function ensureFonts() {
  if (document.getElementById('lq-geist-fonts')) return;
  const l = document.createElement('link');
  l.id = 'lq-geist-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(l);
}

export function Game3D() {
  const host = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated || !host.current) return;
    let el: HTMLElement | null = null, cancelled = false;
    installBridge(); ensureFonts();
    (async () => {
      await import('./lq-icons.js');
      await import('./lq-game.js');
      if (cancelled || !host.current) return;
      el = document.createElement('lq-game');
      host.current.appendChild(el);
    })();
    return () => { cancelled = true; el?.remove(); };
  }, [hydrated]);

  return (
    <div ref={host} className="fixed inset-0 bg-black text-ink" style={{ fontFamily: 'Geist, var(--font-geist-sans), system-ui, sans-serif' }}>
      {!hydrated && <div className="grid h-full place-items-center font-mono text-xs tracking-[.16em] text-ink-muted">LOADING MISSION…</div>}
    </div>
  );
}
