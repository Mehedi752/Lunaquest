import { CREW, EQUIPMENT, P, SOURCES, SUN } from './data';
import type { EventId, EventView, IconName, MissionState, Outcome, Source, Tone } from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;
export const batteryCap = (s: Pick<MissionState, 'levels'>) => P.batteryBase + P.batteryPerLevel * s.levels.battery;

type Preview = [string, string, Tone][];
interface ChoiceDef {
  id: string; label: string; safe: boolean; cost?: number; uncertain?: boolean;
  preview: (s: MissionState) => Preview;
  /** Mutates a cloned state and returns the outcome. */
  apply: (s: MissionState) => Outcome;
}
interface EventDef {
  title: string; severity: 'warning' | 'critical'; icon: IconName; kind: string;
  resources: EventView['resources']; source: Source; science: string;
  situation: (s: MissionState) => string; choices: ChoiceDef[];
}

export function stormDose(s: MissionState, choice: 'shelter' | 'procedures' | 'continue') {
  const pf = P.shieldPF[s.levels.shielding];
  if (choice === 'shelter') return P.stormHazard * (1 - Math.min(.95, pf + .3));
  if (choice === 'procedures') return P.stormHazard * (1 - pf) * .6;
  return P.stormHazard * (1 - pf);
}

export const EVENTS: Record<EventId, EventDef> = {
  storm: {
    title: 'Solar Storm Warning', severity: 'critical', icon: 'sun', kind: 'Space weather', resources: ['radiation', 'health', 'power'],
    situation: s => `Monitoring satellites report a solar particle event heading toward the Moon. Your shelter rating is "${EQUIPMENT[2].effect(s.levels.shielding)}". Two crew members are outside on a surface traverse.`,
    science: 'Beyond Earth’s magnetic field, solar particle events can sharply raise radiation exposure. Real missions answer with forecasting, shielding mass, and storm-shelter procedures. In this game, exposure is an abstract risk index — not a real dose.',
    source: SOURCES.radiation,
    choices: [
      { id: 'shelter', label: 'Move the crew to the protected shelter', safe: true,
        preview: s => [['Exposure risk', `+${r1(stormDose(s, 'shelter'))}`, 'good'], ['Science', 'Paused 2 days', 'warn'], ['Morale', '−2', 'warn']],
        apply: s => { const d = stormDose(s, 'shelter'); s.exposure += d; s.health -= d * 1.5; s.mods.sciencePausedUntil = s.day + 1; s.morale -= 2;
          return { tone: 'success', title: 'Crew sheltered safely', text: `The crew rode out the storm in the shelter. Exposure index +${r1(d)}. Surface science resumes on day ${s.day + 2}.` }; } },
      { id: 'procedures', label: 'Activate emergency procedures and keep essential work going', safe: true,
        preview: s => [['Exposure risk', `+${r1(stormDose(s, 'procedures'))}`, 'warn'], ['Battery', '−15 kWh', 'warn'], ['Science', 'Paused 1 day', 'warn']],
        apply: s => { const d = stormDose(s, 'procedures'); s.exposure += d; s.health -= d * 1.5; s.battery = Math.max(0, s.battery - 15); s.mods.sciencePausedUntil = s.day;
          return { tone: 'warning', title: 'Storm managed with partial protection', text: `EVAs were cancelled and the crew worked from the habitat core. Exposure index +${r1(d)}.` }; } },
      { id: 'continue', label: 'Continue normal operations', safe: false,
        preview: s => [['Exposure risk', `+${r1(stormDose(s, 'continue'))}`, 'bad'], ['Crew health', `−${Math.round(stormDose(s, 'continue') * 1.5)}`, 'bad'], ['Science', 'Continues', 'good']],
        apply: s => { const d = stormDose(s, 'continue'); s.exposure += d; s.health -= d * 1.5; s.unsafe++; s.morale -= 5;
          return { tone: 'failure', title: 'Crew exposed during the storm', text: `Science continued, but the crew absorbed a high exposure index (+${r1(d)}). Unsafe choices lower your Emergency Response score.` }; } },
    ],
  },
  power: {
    title: 'Power System Failure', severity: 'critical', icon: 'zap', kind: 'Equipment failure', resources: ['power', 'oxygen'],
    situation: s => `A power-distribution unit has tripped, cutting array output in half until it is repaired. Battery is at ${Math.round(s.battery)} of ${batteryCap(s)} kWh, and sunlight at the site is ${Math.round((SUN[s.day - 1] ?? 1) * 100)}% of peak.`,
    science: 'Every life-support system depends on electricity. When power is short, engineers shed loads in priority order: crew survival first, experiments last.',
    source: SOURCES.power,
    choices: [
      { id: 'prioritize', label: 'Prioritize essential life-support systems', safe: true,
        preview: () => [['Greenhouse', 'Half power 3 days', 'warn'], ['Science', 'Paused 2 days', 'warn'], ['Array output', '−50% for 3 days', 'bad']],
        apply: s => { s.mods.solarDerateUntil = s.day + 2; s.mods.ghReducedUntil = s.day + 2; s.mods.sciencePausedUntil = s.day + 1;
          return { tone: 'warning', title: 'Essential loads protected', text: 'Nonessential loads were shed while the crew rerouted power. Arrays run at half output for 3 days.' }; } },
      { id: 'backup', label: 'Use backup energy reserves', safe: true,
        preview: s => [['Battery', `−${Math.round(s.battery * .4)} kWh`, 'bad'], ['Array output', '−50% for 2 days', 'bad']],
        apply: s => { s.battery *= .6; s.mods.solarDerateUntil = s.day + 1;
          return { tone: 'warning', title: 'Running on reserves', text: 'Operations continue normally, but the battery margin is thinner for the coming days.' }; } },
      { id: 'repair', label: 'Spend 10 credits on an immediate repair', safe: true, cost: 10,
        preview: () => [['Credits', '−10', 'warn'], ['Array output', 'Restored', 'good']],
        apply: s => { s.credits -= 10; s.log.push({ day: s.day, type: 'repair', text: 'Power-distribution unit replaced (10 credits).' });
          return { tone: 'success', title: 'Repair complete', text: 'A spare unit was installed. Full array output is restored.' }; } },
    ],
  },
  leak: {
    title: 'Water Leak Detected', severity: 'warning', icon: 'droplets', kind: 'Equipment failure', resources: ['water'],
    situation: s => `Pressure sensors show a slow leak in the water-processor loop. Reserves stand at ${Math.round(s.water)} L. Left alone, the loop loses about 10 L per day.`,
    science: 'Water is heavy to launch and hard to replace. Closed-loop recovery systems on the International Space Station recover about 98% of water — but a leak bypasses recycling entirely.',
    source: SOURCES.eclss,
    choices: [
      { id: 'shutdown', label: 'Shut down the affected system', safe: true,
        preview: s => [['Water recycling', 'Offline 2 days', 'bad'], ['Water', `≈ −${Math.round(P.waterPerCrew * CREW * P.recRate[s.levels.recycler] * 2)} L extra`, 'warn']],
        apply: s => { s.mods.recyclerOffUntil = s.day + 1;
          return { tone: 'warning', title: 'Loop isolated', text: 'The recycler is offline for 2 days while seals cure. Water loss increases temporarily.' }; } },
      { id: 'reserves', label: 'Draw on emergency reserves', safe: true,
        preview: () => [['Water', '−40 L', 'bad'], ['Recycling', 'Stays online', 'good']],
        apply: s => { s.water = Math.max(0, s.water - 40);
          return { tone: 'warning', title: 'Reserves used', text: 'The leak was bypassed using reserve plumbing. 40 L were lost in the process.' }; } },
      { id: 'repair', label: 'Repair the system (8 credits + 15 L)', safe: true, cost: 8,
        preview: () => [['Credits', '−8', 'warn'], ['Water', '−15 L', 'warn']],
        apply: s => { s.credits -= 8; s.water = Math.max(0, s.water - 15); s.log.push({ day: s.day, type: 'repair', text: 'Water-processor seal replaced (8 credits).' });
          return { tone: 'success', title: 'Leak repaired', text: 'The seal was replaced. Recycling continues at full rate.' }; } },
    ],
  },
  crop: {
    title: 'Greenhouse Crop Failure', severity: 'warning', icon: 'sprout', kind: 'Biological', resources: ['food'],
    situation: s => `A root-zone watering fault has damaged part of the crop. Food reserves are ${Math.round(s.food)} kg; the crew eats ${P.foodPerCrew * CREW} kg per day.`,
    science: 'Plants need light, water, nutrients and air delivered in balance around their roots. Growing food in space is possible, but it is slow and sensitive to equipment faults.',
    source: SOURCES.plants,
    choices: [
      { id: 'reallocate', label: 'Clear the beds and replant', safe: true,
        preview: () => [['Greenhouse', 'No harvest for 6 days', 'bad'], ['Morale', '−4', 'warn']],
        apply: s => { s.mods.ghDeadUntil = s.day + 1; s.mods.ghMatureDay = s.day + 6; s.morale -= 4;
          return { tone: 'warning', title: 'Crop replanted', text: `New seedlings are in. Next harvest expected on day ${s.day + 6}.` }; } },
      { id: 'recover', label: 'Attempt recovery of the damaged plants', safe: true, uncertain: true,
        preview: () => [['Outcome', 'Uncertain (~60% chance)', 'warn'], ['Water', '−15 L', 'warn']],
        apply: s => { s.water = Math.max(0, s.water - 15);
          const ok = ((s.seed * 9301 + s.day * 49297) % 233280) / 233280 < .6;
          if (ok) return { tone: 'success', title: 'Crop recovered', text: 'Most plants survived after the watering fault was fixed. Harvests continue.' };
          s.mods.ghDeadUntil = s.day + 1; s.mods.ghMatureDay = s.day + 6;
          return { tone: 'failure', title: 'Recovery failed', text: `The plants could not be saved. Beds were replanted; next harvest on day ${s.day + 6}.` }; } },
      { id: 'reduce', label: 'Reduce nonessential food-production demands', safe: true,
        preview: s => [['Greenhouse', 'Half output 5 days', 'warn'], ['Power', `−${(P.ghLoad * s.levels.greenhouse) / 2} kWh/day`, 'good']],
        apply: s => { s.mods.ghReducedUntil = s.day + 4;
          return { tone: 'warning', title: 'Greenhouse scaled back', text: 'Only healthy beds stay lit for 5 days. Output and power use are halved.' }; } },
    ],
  },
};

export const SCHEDULE: { day: number; id: EventId; forecastFrom?: number; requires?: (s: MissionState) => boolean }[] = [
  { day: 6, id: 'storm', forecastFrom: 3 },
  { day: 9, id: 'leak' },
  { day: 13, id: 'power' },
  { day: 18, id: 'crop', requires: s => s.levels.greenhouse > 0 },
  { day: 22, id: 'storm', forecastFrom: 19 },
];
