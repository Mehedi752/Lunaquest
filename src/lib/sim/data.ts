import type { Equipment, Levels, Objective, Source } from './types';

export const CREW = 4;
export const DAYS = 30;
export const BUDGET = 100;

/** Illustrative illumination profile for a high-latitude ridge site (fraction of peak sunlight per mission day). */
export const SUN = [1, 1, .95, .9, .95, 1, 1, .9, .8, .65, .4, .3, .3, .3, .35, .45, .6, .8, .95, 1, 1, 1, .95, .9, .95, 1, 1, .95, .9, .9];

export const P = {
  solarPerLevel: 34,
  batteryBase: 20,
  batteryPerLevel: 60,
  baseLoad: 14,
  o2Load: 5, recLoad: 3, ghLoad: 6,
  o2Gen: [0, 2.6, 3.6, 4.4],
  o2PerCrew: 0.84,
  electrolysis: 1.125,
  waterPerCrew: 3,
  recRate: [0, .75, .88, .95],
  ghWater: 2,
  ghYield: [0, 2.4, 4.2, 5.6],
  ghMature: 8,
  foodPerCrew: 1.8,
  shieldPF: [.2, .5, .75, .9],
  stormHazard: 10,
  objectiveCredits: 12,
  researchLoad: 6,
  bonusO2: 2.5,
  reinforceKwh: 40,
} as const;

export const CAPS = { o2: 150, water: 400, food: 300 } as const;
export const START = { o2: 60, water: 300, food: 180 } as const;

export const SHIELD_TIERS = ['Minimal protection', 'Basic shelter', 'Enhanced shelter', 'Hardened storm shelter'];

export const EQUIPMENT: Equipment[] = [
  { id: 'solar', name: 'Solar Arrays', category: 'Energy', icon: 'sun', costs: [15, 15, 20], max: 3,
    purpose: 'Convert sunlight into electrical power for every system.',
    tradeoff: 'Output drops sharply when terrain shadows the site.',
    tip: 'On the Moon, long periods without sunlight make solar power alone risky.',
    operatingCost: 'None', limitation: 'Useless in shadow; does not store energy.',
    effect: l => `${Math.round(P.solarPerLevel * l)} kWh/day peak` },
  { id: 'battery', name: 'Battery Storage', category: 'Energy', icon: 'battery', costs: [15, 15, 20], max: 3,
    purpose: 'Store surplus energy for periods of low sunlight.',
    tradeoff: 'Stores energy but generates none.',
    tip: 'Batteries bridge the gap between generation and demand.',
    operatingCost: 'None', limitation: 'Only stores what the arrays produce.',
    effect: l => `${P.batteryBase + P.batteryPerLevel * l} kWh capacity` },
  { id: 'shielding', name: 'Radiation Shielding', category: 'Radiation Protection', icon: 'shield', costs: [20, 20, 25], max: 3,
    purpose: 'Add regolith and water-wall mass around a crew shelter.',
    tradeoff: 'Expensive, and it does nothing until a storm arrives.',
    tip: 'Mass between the crew and incoming particles reduces exposure during solar storms.',
    operatingCost: 'None', limitation: 'No benefit until a storm arrives.',
    effect: l => SHIELD_TIERS[l] },
  { id: 'recycler', name: 'Water Recycling', category: 'Water', icon: 'droplets', costs: [15, 15, 20], max: 3,
    purpose: 'Recover drinkable water from humidity and wastewater.',
    tradeoff: 'Needs power and never recovers 100%.',
    tip: 'Recycling slows water loss; it cannot create water.',
    operatingCost: `${P.recLoad} kWh/day per level`, limitation: 'Never 100%; stops if power is shed.',
    effect: l => `${Math.round(P.recRate[l] * 100)}% recovery` },
  { id: 'greenhouse', name: 'Greenhouse', category: 'Food Production', icon: 'sprout', costs: [15, 15, 20], max: 3,
    purpose: 'Grow fresh food under LED lighting.',
    tradeoff: `Uses power and water; first harvest on day ${P.ghMature}.`,
    tip: 'Plants take time to grow, so food production starts slowly.',
    operatingCost: `${P.ghLoad} kWh + ${P.ghWater} L water/day per level`, limitation: 'Slow to start; vulnerable to faults.',
    effect: l => `${P.ghYield[l]} kg food/day once mature` },
  { id: 'oxygen', name: 'Oxygen Generation', category: 'Life Support', icon: 'wind', costs: [15, 15, 20], max: 3,
    purpose: 'Split water into breathable oxygen by electrolysis.',
    tradeoff: 'Every kg of oxygen consumes about 1.1 L of water and power.',
    tip: 'Without oxygen generation, the crew lives off a finite tank.',
    operatingCost: `${P.o2Load} kWh/day + water for electrolysis`, limitation: 'Consumes water — can drain your tanks.',
    effect: l => `${P.o2Gen[l]} kg O₂/day` },
  { id: 'reserves', name: 'Emergency Reserves', category: 'Emergency Systems', icon: 'package', costs: [10, 10, 10], max: 3,
    purpose: 'Pre-positioned cache of food, water and oxygen.',
    tradeoff: 'One-time supply; it does not replenish.',
    tip: 'Reserves buy time when a system fails.',
    operatingCost: 'None', limitation: 'One-time supply; does not replenish.',
    effect: l => (l ? `+${50 * l} kg food · +${60 * l} L water · +${25 * l} kg O₂` : 'No cache') },
];

export const OBJECTIVES: Objective[] = [
  { id: 'regolith', name: 'Regolith sample analysis', days: 3 },
  { id: 'seismic', name: 'Deploy seismometer network', days: 4 },
  { id: 'ice', name: 'Polar ice prospecting', days: 5 },
  { id: 'plants', name: 'Plant growth experiment', days: 4 },
  { id: 'radmap', name: 'Radiation environment mapping', days: 5 },
];

export const PRESETS: Record<'balanced' | 'risky', Levels> = {
  balanced: { solar: 1, battery: 1, shielding: 1, recycler: 1, greenhouse: 1, oxygen: 1, reserves: 0 },
  risky: { solar: 2, battery: 1, shielding: 0, recycler: 1, greenhouse: 1, oxygen: 0, reserves: 1 },
};

export const CREW_MANIFEST = [
  { code: 'CDR', name: 'Mehedi Hasan (you)', role: 'Mission Commander' },
  { code: 'FE', name: 'Maimuna Rahman', role: 'Flight Engineer · power & life support' },
  { code: 'SO', name: 'Nahid Hasan', role: 'Science Officer · geology' },
  { code: 'MO', name: 'Joy Barua', role: 'Medical Officer · crew health' },
];

export const SOURCES = {
  eclss: { label: 'NASA Marshall — Environmental Control and Life Support System fact sheet (PDF)', url: 'https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf' },
  radiation: { label: 'NASA NTRS — Deep Space Radiation Measurements and Crew Radiation Protection for Artemis', url: 'https://ntrs.nasa.gov/citations/20250002757' },
  power: { label: 'NASA Glenn — Fission Surface Power Project Energizes Lunar Exploration', url: 'https://www.nasa.gov/centers-and-facilities/glenn/nasas-fission-surface-power-project-energizes-lunar-exploration' },
  plants: { label: 'NASA — Growing Plants in Space', url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/' },
  veggie: { label: 'NASA Science — Veggie', url: 'https://science.nasa.gov/mission/veggie/' },
  ecls: { label: 'NASA NTRS — Environmental Control and Life Support Systems (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20210010644/downloads/132-1-Final.pdf' },
  spaceApps: { label: 'NASA Space Apps Challenge', url: 'https://www.spaceappschallenge.org/' },
} satisfies Record<string, Source>;

export const SIM_RULES = [
  'Time advances one day at a time, only when you press Advance One Day. Real-world time has no effect.',
  'Each astronaut uses 0.84 kg oxygen, 3 L water and 1.8 kg food per day.',
  'Making 1 kg of oxygen by electrolysis consumes 1.125 kg (≈1.1 L) of water.',
  'Solar output follows a fixed illumination profile; a shadow period occurs mid-mission.',
  'If the battery empties, loads are shed in order: greenhouse, water recycling, then oxygen.',
  'Radiation exposure is an abstract risk index, not a real radiation dose.',
  'Completing a science objective earns 12 credits for upgrades and repairs.',
  'If oxygen reaches zero or crew health falls to zero, the mission is aborted.',
];
