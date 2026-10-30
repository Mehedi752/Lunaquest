/** LunaQuest simulation types. Illustrative gameplay model — NOT an engineering tool. */

export type Status = 'stable' | 'warning' | 'critical';
export type Tone = 'good' | 'warn' | 'bad';
export type OutcomeTone = 'success' | 'warning' | 'failure';
export type EquipmentId = 'solar' | 'battery' | 'shielding' | 'recycler' | 'greenhouse' | 'oxygen' | 'reserves';
export type Levels = Record<EquipmentId, number>;
export type EventId = 'storm' | 'power' | 'leak' | 'crop';
export type IconName =
  | 'sun' | 'battery' | 'shield' | 'droplets' | 'sprout' | 'wind' | 'package' | 'zap' | 'heart' | 'home';
export type MissionStatus = 'active' | 'complete' | 'failed';
export type LogType = 'decision' | 'event' | 'failure' | 'repair' | 'objective' | 'purchase' | 'alert';
export type EquipmentCategory = 'Energy' | 'Radiation Protection' | 'Water' | 'Food Production' | 'Life Support' | 'Emergency Systems';

export interface Source { label: string; url: string }

export interface Equipment {
  id: EquipmentId;
  name: string;
  category: EquipmentCategory;
  icon: IconName;
  costs: number[];
  max: number;
  purpose: string;
  tradeoff: string;
  tip: string;
  operatingCost: string;
  limitation: string;
  effect: (level: number) => string;
}

export interface Objective { id: string; name: string; days: number }
export interface ObjectiveProgress { id: string; progress: number; done: boolean }

export interface Mods {
  sciencePausedUntil?: number;
  solarDerateUntil?: number;
  recyclerOffUntil?: number;
  ghReducedUntil?: number;
  ghDeadUntil?: number;
  ghMatureDay?: number;
}

export interface LogEntry {
  day: number;
  type: LogType;
  text: string;
  cause?: string;
  tone?: OutcomeTone;
  unsafe?: boolean;
  severity?: 'warning' | 'critical';
}

export interface Snapshot {
  day: number; o2: number; water: number; food: number; battery: number; batteryCap: number;
  health: number; morale: number; gen: number; load: number; sun: number; shed: string[];
}

export interface Outcome { tone: OutcomeTone; title: string; text: string; event?: string; why?: string }
export interface Failure { day: number; system: string; text: string }

export type ScenarioId = 'outpost' | 'night' | 'storm' | 'water';
export type PowerKey = 'oxygen' | 'recycler' | 'greenhouse' | 'research';
export type CommsMode = 'moon' | 'mars';
export interface ScheduledEvent { day: number; id: EventId; forecastFrom?: number; mag?: number; falseAlarm?: boolean }
export interface Advice { event: EventId; askedDay: number; mode: CommsMode; status: 'transit' | 'waiting' | 'ready'; recommend: string | null; text: string }
export interface DayReport { day: number; delta: { o2: number; water: number; food: number; battery: number }; why: string[]; science: string | null }
export interface SpaceWeather { status: 'live' | 'cached' | 'curated'; tier: 'high' | 'elevated' | 'moderate'; label?: string; detail?: string; url?: string | null; fetchedAt?: number | null; range?: [string, string] | null; error?: string }
export interface Scenario { id: ScenarioId; name: string; short: string; site: string; days: number; budget: number; objectivesRequired: number; difficulty: string; goal: string; lesson: string }

export interface MissionState {
  v: 1;
  scenario?: ScenarioId;
  days?: number;
  budget?: number;
  schedule?: ScheduledEvent[];
  fired?: number[];
  power?: Record<PowerKey, boolean>;
  comms?: CommsMode;
  advice?: Advice | null;
  bonusDay?: number;
  lastDay?: DayReport | null;
  decisions?: Array<{ day: number; event: string; title: string; choice: string; label: string; safe: boolean; tone: string }>;
  spaceWeather?: SpaceWeather | null;
  mission: string;
  day: number;
  status: MissionStatus;
  crew: number;
  levels: Levels;
  credits: number;
  seed: number;
  o2: number; water: number; food: number; battery: number;
  health: number; morale: number; exposure: number;
  objectives: ObjectiveProgress[];
  mods: Mods;
  pendingEvent: EventId | null;
  lastOutcome: Outcome | null;
  unsafe: number;
  brownoutDays: number;
  minO2Ratio: number;
  history: Snapshot[];
  log: LogEntry[];
  failure: Failure | null;
}

export interface Rates {
  sun: number; gen: number; load: number; recOn: boolean; ghFactor: number;
  loads: { base: number; oxygen: number; recycler: number; greenhouse: number; research?: number };
}

export interface ResourceReading {
  value: number; cap: number; net: number; unit: 'kg' | 'L' | 'kWh'; days: number; status: Status;
}

export interface ResourceView {
  o2: ResourceReading & { consumption: number; production: number };
  water: ResourceReading & { consumption: number; recycling: number; recOn: boolean };
  food: ResourceReading & { consumption: number; production: number };
  power: ResourceReading & { gen: number; load: number; loads: Rates['loads']; sun: number };
  radiation: { tier: string; level: number; risk: 'Nominal' | 'Elevated' | 'Storm'; status: Status };
  crew: { health: number; morale: number; exposure: 'Low' | 'Moderate' | 'High'; status: Status };
}

export interface Alert { level: Exclude<Status, 'stable'>; title: string; text: string; key: string }
export interface Forecast { day: number; title: string; text: string; kind?: 'storm' | 'night' }

export interface PreviewLine { label: string; value: string; tone: Tone }
export interface ChoiceView {
  id: string; label: string; safe: boolean; uncertain: boolean; disabled: boolean; cost: number; preview: PreviewLine[]; reason?: string;
}
export interface EventView {
  id: EventId; title: string; severity: 'warning' | 'critical'; kind: string; icon: IconName;
  resources: Array<'radiation' | 'health' | 'power' | 'oxygen' | 'water' | 'food'>;
  situation: string; science: string; source: Source; choices: ChoiceView[];
  advice?: Advice | null; comms?: { id: CommsMode; label: string; delayText: string; roundTripSec: number | null; note: string };
}

export interface ScoreCategory { id: string; label: string; max: number; value: number; basis: string }
export interface Achievement { id: string; name: string; earned: boolean; criterion: string }
export interface Score { total: number; max: number; cats: ScoreCategory[]; achievements: Achievement[]; objectivesDone: number; minRatio: number; required?: number; result?: 'success' | 'partial' | 'failed' | 'active' }
