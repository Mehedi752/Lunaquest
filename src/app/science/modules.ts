import { Droplets, Home, Layers, Shield, Sprout, Wind, Zap, type LucideIcon } from 'lucide-react';
import { SOURCES, type Source } from '@/lib/sim';

export interface Module {
  id: 'life' | 'rad' | 'energy' | 'water' | 'food' | 'hab' | 'trade';
  icon: LucideIcon; tag: string; title: string; question: string; explain: string;
  game: string; real: string; simplify: string; figcap: string; source?: Source;
}

export const MODULES: Module[] = [
  { id: 'life', icon: Wind, tag: 'Life support', title: 'Life-support systems', question: 'Where does a crew’s air come from on a world with no atmosphere?',
    explain: 'A habitat has to manage pressure, ventilation, oxygen, carbon dioxide and fire safety continuously. Oxygen can be produced by splitting water with electricity — which means air, water and power are all linked.',
    game: 'The Oxygen Generation system makes 2.6–4.4 kg/day depending on level. Each kilogram uses about 1.1 L of water and the system draws 5 kWh/day per level.',
    real: 'The space station’s ECLSS includes a Water Recovery System, an Air Revitalization System and an Oxygen Generation System that work together.',
    simplify: 'CO₂ removal, pressure and fire safety are not modelled.', source: SOURCES.eclss, figcap: 'FIG. 1 — ELECTROLYSIS MASS BALANCE (2H₂O → 2H₂ + O₂)' },
  { id: 'rad', icon: Shield, tag: 'Radiation', title: 'Radiation & shielding', question: 'Why does radiation shielding matter?',
    explain: 'Beyond Earth’s protective magnetic field, astronauts face higher radiation hazards — including bursts of energetic particles from the Sun. Habitat designers plan shielding mass and storm-shelter procedures so crews can wait out solar storms.',
    game: 'Your shielding level sets how much of a storm’s hazard is blocked. Sheltering adds protection but pauses science. Your construction spending decides how much protection you have when a storm arrives.',
    real: 'Artemis crews can rearrange equipment and supplies into a storm shelter, guided by space-weather forecasts and onboard radiation sensors.',
    simplify: 'Exposure is an abstract index, not a radiation dose.', source: SOURCES.radiation, figcap: 'FIG. 2 — SHARE OF STORM HAZARD BLOCKED, BY SHIELDING LEVEL (GAME VALUES)' },
  { id: 'energy', icon: Zap, tag: 'Energy', title: 'Energy generation & storage', question: 'What happens to a solar-powered base when the Sun disappears?',
    explain: 'Solar arrays only produce power in sunlight. A full lunar night lasts about 14.5 Earth days, and even near the poles, terrain can shadow a site for long stretches. Stored energy has to bridge every gap.',
    game: 'Arrays produce 34 kWh/day per level at full sun. When generation and battery both fall short, the outpost sheds loads in order: greenhouse, water recycling, then oxygen.',
    real: 'NASA is developing fission surface power to provide electricity independently of sunlight through the lunar night.',
    simplify: 'Sunlight follows a fixed, illustrative 30-day profile.', source: SOURCES.power, figcap: 'FIG. 3 — ILLUSTRATIVE SUNLIGHT AT THE OUTPOST SITE, DAYS 1–30' },
  { id: 'water', icon: Droplets, tag: 'Water', title: 'Water recycling', question: 'Can a sealed habitat reuse the same water forever?',
    explain: 'Recycling captures humidity and wastewater and purifies it — but no system recovers every drop. Recycling slows the decline of your reserves; it never creates new water.',
    game: 'Recyclers recover 75%, 88% or 95% of used water by level and draw 3 kWh/day per level. Leaks bypass recycling completely.',
    real: 'The space station’s Water Recovery System can recover about 98% of its water, including humidity and urine.',
    simplify: 'Water quality and filter maintenance are not modelled.', source: SOURCES.eclss, figcap: 'FIG. 4 — DAILY LOSS OF 12 L USED, AT EACH RECOVERY RATE' },
  { id: 'food', icon: Sprout, tag: 'Agriculture', title: 'Controlled-environment agriculture', question: 'Can astronauts grow their own food?',
    explain: 'Plants need light, water, nutrients and air delivered in balance around their roots. Under LED lighting, crops can grow in a closed habitat — slowly, and only if the equipment keeps working.',
    game: 'The greenhouse costs power and water from day 1 but gives no food until its first harvest on day 8. A crop failure resets the clock.',
    real: 'NASA’s Veggie system on the space station has grown lettuces, Chinese cabbage, mizuna, kale and zinnia flowers.',
    simplify: 'Crop types, nutrition and lighting are not modelled.', source: SOURCES.veggie, figcap: 'FIG. 5 — GREENHOUSE OUTPUT, DAYS 1–14' },
  { id: 'hab', icon: Home, tag: 'Habitat', title: 'Space habitat engineering', question: 'Why does one failure ripple through the whole outpost?',
    explain: 'Habitat systems depend on each other. Oxygen needs water and power; recycling needs power; food needs power and water. Engineers map these dependencies so a single fault doesn’t cascade.',
    game: 'Every system in LunaQuest is linked through shared power and water. Upgrading one can raise demand on another.',
    real: 'Life-support designers treat breathable air as the most critical function, with water close behind.',
    simplify: 'Thermal control, mass and volume are not modelled.', source: SOURCES.ecls, figcap: 'FIG. 6 — SYSTEM DEPENDENCIES IN THE GAME MODEL' },
  { id: 'trade', icon: Layers, tag: 'Trade-offs', title: 'Resource trade-offs', question: 'Why can’t you just build everything?',
    explain: 'Real missions are limited by mass, volume, power and cost. Redundancy improves reliability, but every spare part is something else left behind. Good engineering is choosing which risks to accept.',
    game: 'Your 100-credit budget stands in for all of those limits. Science objectives earn credits back during the mission.',
    real: 'Mission planners weigh what to launch from Earth against what can be recycled or produced on site.',
    simplify: 'Credits replace mass, volume and cost.', figcap: 'FIG. 7 — LEVEL-1 OF EVERY SYSTEM (105 CR) VS. THE 100-CREDIT BUDGET' },
];
