/**
 * LunaQuest simulation engine — typed facade over the shared core (./core.ts, ported 1:1 from the prototype engine v2).
 * Illustrative gameplay model. NOT suitable for real spacecraft design or crew safety.
 */
import core from './core';
import type {
  Advice, Alert, CommsMode, EquipmentId, EventView, Forecast, Levels, MissionState, PowerKey, Rates, ResourceView, Scenario, ScenarioId, Score, SpaceWeather,
} from './types';

const C = core as any;

export const SCENARIOS = C.SCENARIOS as Record<ScenarioId, Scenario>;
export const POWER_KEYS = C.POWER_KEYS as Record<PowerKey, string>;
export const COMMS = C.COMMS as Record<CommsMode, { id: CommsMode; label: string; delayText: string; roundTripSec: number | null; note: string }>;
export const TIER = C.TIER as Record<'high' | 'elevated' | 'moderate', number>;

export const emptyLevels = (): Levels => C.emptyLevels();
export const configCost = (levels: Levels): number => C.configCost(levels);
export const nextCost = (id: EquipmentId, level: number): number | null => C.nextCost(id, level);
export const batteryCap = (s: Pick<MissionState, 'levels'> & Partial<MissionState>): number => C.batteryCap(s);

export interface NewMissionOptions { scenario?: ScenarioId; seed?: number; spaceWeather?: SpaceWeather | null; comms?: CommsMode }
/** A fresh mission. Emergencies come from a seeded generator: every seed is a different (but repeatable) mission. */
export const newMission = (levels?: Partial<Levels>, opts?: NewMissionOptions): MissionState => C.newMission(levels, opts);
export const advanceDay = (s: MissionState): MissionState => C.advanceDay(s);
export const resolveEvent = (s: MissionState, choiceId: string): MissionState => C.resolveEvent(s, choiceId);
export const purchase = (s: MissionState, id: EquipmentId): MissionState => C.purchase(s, id);
export const rates = (s: MissionState, day?: number): Rates => C.rates(s, day);
export const resources = (s: MissionState): ResourceView => C.resources(s);
export const alerts = (s: MissionState): Alert[] => C.alerts(s);
export const insights = (s: MissionState): string[] => C.insights(s);
export const forecast = (s: MissionState): Forecast[] => C.forecast(s);
export const eventView = (s: MissionState): EventView | null => C.eventView(s);
export const score = (s: MissionState): Score => C.score(s);

// v2 mechanics
export const setPower = (s: MissionState, key: PowerKey, on: boolean): MissionState => C.setPower(s, key, on);
export const powerOf = (s: MissionState | null): Record<PowerKey, boolean> => C.powerOf(s);
export const setComms = (s: MissionState, mode: CommsMode): MissionState => C.setComms(s, mode);
export const requestAdvice = (s: MissionState): MissionState => C.requestAdvice(s);
export const receiveAdvice = (s: MissionState): MissionState => C.receiveAdvice(s);
export const waitForReply = (s: MissionState): MissionState => C.waitForReply(s);
export const bonusInfo = (s: MissionState): { available: boolean; reason: string; o2: number; job: string | null } => C.bonusInfo(s);
export const bonusExperiment = (s: MissionState): MissionState => C.bonusExperiment(s);
export const scenarioOf = (s: MissionState): Scenario => C.scenarioOf(s);
export const daysOf = (s: MissionState): number => C.daysOf(s);
export const sunOf = (s: MissionState): number[] => C.sunOf(s);
export type { Advice };

/** Run a whole mission with a fixed policy — used for sample debriefs and projections. */
export const autoplay = (kind: 'success' | 'failure', scenario: ScenarioId = 'outpost'): MissionState => C.autoplay(kind, scenario);

/** Project a configuration over the scenario, ignoring emergencies. */
export function project(levels: Levels, scenario: ScenarioId = 'outpost') {
  let s = newMission(levels, { scenario }); let firstShortfall: number | null = null;
  for (let g = 0; s.status === 'active' && g < 40; g++) {
    s = advanceDay({ ...s, pendingEvent: null });
    if (firstShortfall === null && s.history[s.history.length - 1].shed.length) firstShortfall = s.day - 1;
  }
  return { final: s, firstShortfall };
}
