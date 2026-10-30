// @ts-nocheck
/* AUTO-PORTED from the prototype engine (lunaquest-sim.js v2). Keep the two in sync.
   Pure simulation: random seeded emergencies, 4 scenarios, power switches, water-limited electrolysis,
   communication delay, reinforced shelter, bonus experiment, daily explanations. */

  const KEY = 'lunaquest.v1';
  const CREW = 4, DAYS = 30, BUDGET = 100;

  // Illustrative illumination profile for a high-latitude ridge site (fraction of peak sunlight per mission day).
  const SUN = [1, 1, .95, .9, .95, 1, 1, .9, .8, .65, .4, .3, .3, .3, .35, .45, .6, .8, .95, 1, 1, 1, .95, .9, .95, 1, 1, .95, .9, .9];

  const P = {
    solarPerLevel: 34,           // kWh/day at full sun per array level
    batteryBase: 20, batteryPerLevel: 60, // kWh
    baseLoad: 14,                // habitat thermal, avionics, comms (kWh/day)
    o2Load: 5, recLoad: 3, ghLoad: 6, // kWh/day per level
    o2Gen: [0, 2.6, 3.6, 4.4],   // kg O2/day
    o2PerCrew: 0.84,             // kg/person/day
    electrolysis: 1.125,         // kg water per kg O2 (stoichiometric)
    waterPerCrew: 3,             // L/person/day (drinking, food prep, hygiene)
    recRate: [0, .75, .88, .95], // fraction of used water recovered
    ghWater: 2,                  // L/day per greenhouse level
    ghYield: [0, 2.4, 4.2, 5.6], // kg edible food/day once mature
    ghMature: 8,                 // first harvest day
    foodPerCrew: 1.8,            // kg/person/day
    shieldPF: [.2, .5, .75, .9], // fraction of storm hazard blocked (abstract)
    stormHazard: 10,
    objectiveCredits: 12,
    researchLoad: 6,
    bonusO2: 2.5,                // kg O₂ to refill suits for a bonus spacewalk experiment (game value)
    reinforceKwh: 40,            // kWh the shelter's water-wall pumps take from the battery (game value)             // kWh/day while surface science runs (power vs science trade-off)
  };

  const EQUIPMENT = [
    { id: 'solar', name: 'Solar Arrays', category: 'Energy', icon: 'sun', costs: [15, 15, 20], max: 3,
      purpose: 'Convert sunlight into electrical power for every system.',
      tradeoff: 'Output drops sharply when terrain shadows the site.',
      tip: 'On the Moon, long periods without sunlight make solar power alone risky.',
      effect: l => `${Math.round(P.solarPerLevel * l)} kWh/day peak` },
    { id: 'battery', name: 'Battery Storage', category: 'Energy', icon: 'battery', costs: [15, 15, 20], max: 3,
      purpose: 'Store surplus energy for periods of low sunlight.',
      tradeoff: 'Stores energy but generates none.',
      tip: 'Batteries bridge the gap between generation and demand.',
      effect: (l, s) => `${P.batteryBase + perLevel(s) * l} kWh capacity` },
    { id: 'shielding', name: 'Radiation Shielding', category: 'Radiation Protection', icon: 'shield', costs: [20, 20, 25], max: 3,
      purpose: 'Add regolith and water-wall mass around a crew shelter.',
      tradeoff: 'Expensive, and it does nothing until a storm arrives.',
      tip: 'Mass between the crew and incoming particles reduces exposure during solar storms.',
      effect: l => ['Minimal protection', 'Basic shelter', 'Enhanced shelter', 'Hardened storm shelter'][l] },
    { id: 'recycler', name: 'Water Recycling', category: 'Water', icon: 'droplets', costs: [15, 15, 20], max: 3,
      purpose: 'Recover drinkable water from humidity and wastewater.',
      tradeoff: 'Needs power and never recovers 100%.',
      tip: 'Recycling slows water loss; it cannot create water.',
      effect: l => `${Math.round(P.recRate[l] * 100)}% recovery` },
    { id: 'greenhouse', name: 'Greenhouse', category: 'Food Production', icon: 'sprout', costs: [15, 15, 20], max: 3,
      purpose: 'Grow fresh food under LED lighting.',
      tradeoff: `Uses power and water; first harvest on day ${8}.`,
      tip: 'Plants take time to grow, so food production starts slowly.',
      effect: l => `${P.ghYield[l]} kg food/day once mature` },
    { id: 'oxygen', name: 'Oxygen Generation', category: 'Life Support', icon: 'wind', costs: [15, 15, 20], max: 3,
      purpose: 'Split water into breathable oxygen by electrolysis.',
      tradeoff: 'Every kg of oxygen consumes about 1.1 L of water and power.',
      tip: 'Without oxygen generation, the crew lives off a finite tank.',
      effect: l => `${P.o2Gen[l]} kg O₂/day` },
    { id: 'reserves', name: 'Emergency Reserves', category: 'Emergency Systems', icon: 'package', costs: [10, 10, 10], max: 3,
      purpose: 'Pre-positioned cache of food, water and oxygen.',
      tradeoff: 'One-time supply; it does not replenish.',
      tip: 'Reserves buy time when a system fails.',
      effect: l => l ? `+${50 * l} kg food · +${60 * l} L water · +${25 * l} kg O₂` : 'No cache' },
  ];

  const OBJECTIVES = [
    { id: 'regolith', name: 'Regolith sample analysis', days: 3 },
    { id: 'seismic', name: 'Deploy seismometer network', days: 4 },
    { id: 'ice', name: 'Polar ice prospecting', days: 5 },
    { id: 'plants', name: 'Plant growth experiment', days: 4 },
    { id: 'radmap', name: 'Radiation environment mapping', days: 5 },
  ];

  const CAPS = { o2: 150, water: 400, food: 300 };
  const START = { o2: 60, water: 300, food: 180 };

  // Scenarios. A lunar night at a non-polar site lasts about 14.75 Earth days (reference); everything else here is a game parameter.
  const NIGHT_SUN = [1, 1, 1, 1, 1, 1, 1, .5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .5, 1];
  const SCENARIOS = {
    outpost: { id: 'outpost', name: 'Lunar Outpost Alpha', short: 'Full mission', site: 'South-polar ridge · long sunlit periods with terrain shadow (illustrative)', days: 30, budget: 100, sun: SUN, start: START, schedule: 'standard', objectivesRequired: 3, vary: true, difficulty: 'Intermediate',
      goal: 'Keep four astronauts safe for 30 days and finish at least 3 science objectives.', lesson: 'Every system is linked — power, water, air and food.' },
    night: { id: 'night', name: 'First Lunar Night', short: 'Survive the dark', site: 'Mid-latitude mare · about 14 Earth days without sunlight', days: 24, budget: 120, sun: NIGHT_SUN, start: { o2: 90, water: 300, food: 180 }, batteryPerLevel: 80, schedule: [], objectivesRequired: 1, difficulty: 'Hard',
      goal: 'Bank energy before sunset on day 9, switch off what you can, and keep the habitat warm for 14 dark days.', lesson: 'Energy storage and load management decide survival.' },
    storm: { id: 'storm', name: 'Solar Weather Alert', short: 'Protect the crew', site: 'South-polar ridge', days: 12, budget: 100, sun: SUN.slice(0, 12), start: START, schedule: [{ day: 4, id: 'storm', forecastFrom: 2 }, { day: 9, id: 'storm', forecastFrom: 7 }], objectivesRequired: 1, difficulty: 'Explorer', usesSpaceWeather: true,
      goal: 'Solar storms will strike at unknown times, and not every warning comes true. Keep exposure low and still finish one science objective.', lesson: 'Shielding reduces risk — it never removes it.' },
    water: { id: 'water', name: 'Water Under Pressure', short: 'Stretch every litre', site: 'South-polar ridge', days: 15, budget: 100, sun: SUN.slice(0, 15), start: { o2: 60, water: 140, food: 180 }, schedule: [{ day: 3, id: 'leak' }, { day: 8, id: 'leak' }], objectivesRequired: 1, difficulty: 'Intermediate',
      goal: 'Water is low and the loop keeps leaking. Balance recycling, oxygen-making and crops for 15 days.', lesson: 'Recycling slows loss; it never creates water.' },
  };
  let lastScen = 'outpost';
  // ---------- random emergencies ----------
  // Each mission draws its own emergencies from a seeded generator: how many, which kinds, which days, how strong.
  // Storms are forecast 2–3 days ahead, and some forecasts are false alarms. Equipment faults arrive without warning.
  function rng(seed) { let a = (Math.imul(seed | 0, 2654435761) >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const EVENT_PLAN = {
    outpost: { kinds: [['storm', 1, 2], ['power', 0, 1], ['leak', 1, 2], ['crop', 0, 1]], falseAlarms: [0, 1], from: 3, toEnd: 2 },
    storm:   { kinds: [['storm', 2, 2]], falseAlarms: [0, 1], from: 3, toEnd: 1 },
    water:   { kinds: [['leak', 2, 2], ['power', 0, 1]], falseAlarms: [0, 0], from: 3, toEnd: 2 },
    night:   { kinds: [['leak', 0, 1], ['power', 0, 1]], falseAlarms: [0, 1], from: 3, toEnd: 2 },
  };
  function genSchedule(sc, seed) {
    const r = rng(seed * 7919 + sc.id.length * 131), plan = EVENT_PLAN[sc.id] || EVENT_PLAN.outpost;
    const pick = (a, b) => a + Math.floor(r() * (b - a + 1));
    const lo = plan.from, hi = sc.days - plan.toEnd, used = [];
    const place = (gap, min) => { for (let t = 0; t < 60; t++) { const d = pick(Math.max(lo, min || 0), hi); if (used.every(u => Math.abs(u - d) >= gap)) { used.push(d); return d; } } return null; };
    const out = [];
    const want = [];
    plan.kinds.forEach(([id, a, b]) => { for (let k = pick(a, b); k > 0; k--) want.push(id); });
    for (let k = pick(plan.falseAlarms[0], plan.falseAlarms[1]); k > 0; k--) want.push('watch');
    want.forEach(id => {
      const storm = id === 'storm' || id === 'watch', day = place(3, storm ? 5 : 0) ?? place(2, storm ? 5 : 0); if (day == null) return;
      if (storm) out.push({ day, id: 'storm', forecastFrom: Math.max(2, day - pick(2, 3)), mag: Math.round((0.8 + r() * 0.4) * 100) / 100, falseAlarm: id === 'watch' || undefined });
      else out.push({ day, id });
    });
    return out.sort((x, y) => x.day - y.day);
  }
  const scen = s => SCENARIOS[(s && s.scenario) || lastScen] || SCENARIOS.outpost;
  const perLevel = s => scen(s).batteryPerLevel || P.batteryPerLevel;
  const sunOf = s => scen(s).sun;
  const daysOf = s => (s && s.days) || scen(s).days;
  const scheduleOf = s => (s && s.schedule) || SCHEDULE;
  const POWER_KEYS = { oxygen: 'Oxygen generator', recycler: 'Water recycler', greenhouse: 'Greenhouse lights', research: 'Surface research' };
  function powerOf(s) { return Object.assign({ oxygen: true, recycler: true, greenhouse: true, research: true }, (s && s.power) || {}); }
  const TIER = { high: 1.25, elevated: 1, moderate: .8 };
  // Communication delay. Light-travel times are physical facts; how the game turns them into waiting is a game rule.
  const COMMS = {
    moon: { id: 'moon', label: 'Moon distance', delayText: 'about 1.3 seconds each way', roundTripSec: 2.6,
      note: 'Radio signals take about 1.3 seconds to travel between Earth and the Moon, so help from Mission Control arrives almost at once.' },
    mars: { id: 'mars', label: 'Mars-distance drill', delayText: 'about 3 to 22 minutes each way', roundTripSec: null,
      note: 'Between Earth and Mars, signals take about 3 to 22 minutes each way, depending on where the planets are. In this drill, Earth’s reply arrives the next day — so you either decide alone or wait and spend a day.' },
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const r1 = n => Math.round(n * 10) / 10;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function emptyLevels() { return { solar: 0, battery: 0, shielding: 0, recycler: 0, greenhouse: 0, oxygen: 0, reserves: 0 }; }
  function configCost(levels) {
    return EQUIPMENT.reduce((t, e) => { for (let i = 0; i < levels[e.id]; i++) t += e.costs[i]; return t; }, 0);
  }
  function nextCost(id, level) { const e = EQUIPMENT.find(x => x.id === id); return level >= e.max ? null : e.costs[level]; }
  function batteryCap(s) { return P.batteryBase + perLevel(s) * s.levels.battery; }

  function newMission(levels, opts) {
    opts = opts || {};
    const sc = SCENARIOS[opts.scenario] || SCENARIOS.outpost; lastScen = sc.id;
    const L = Object.assign(emptyLevels(), levels || {});
    const seed = Number.isFinite(opts.seed) ? Math.abs(Math.floor(opts.seed)) : 7;
    const schedule = genSchedule(sc, seed); // random per mission (seeded, so a replay of the same seed is identical)
    const s = {
      v: 1, scenario: sc.id, mission: sc.name, days: sc.days, day: 1, status: 'active', crew: CREW,
      levels: L, credits: sc.budget - configCost(L), budget: sc.budget, seed, schedule, fired: [],
      power: powerOf(null), spaceWeather: opts.spaceWeather || null, comms: COMMS[opts.comms] ? opts.comms : 'moon', advice: null, bonusDay: 0,
      o2: sc.start.o2 + 25 * L.reserves, water: sc.start.water + 60 * L.reserves, food: sc.start.food + 50 * L.reserves,
      battery: 0, health: 100, morale: 80, exposure: 0,
      objectives: OBJECTIVES.map(o => ({ id: o.id, progress: 0, done: false })),
      mods: {}, pendingEvent: null, lastOutcome: null, lastDay: null, unsafe: 0, brownoutDays: 0, minO2Ratio: 1,
      history: [], log: [], decisions: [], failure: null,
    };
    if (s.credits < 0) throw new Error('Configuration exceeds the scenario budget');
    s.o2 = Math.min(s.o2, CAPS.o2); s.water = Math.min(s.water, CAPS.water); s.food = Math.min(s.food, CAPS.food);
    s.battery = batteryCap(s);
    s.log.push({ day: 1, type: 'decision', text: `${sc.name} deployed with ${configCost(L)} of ${sc.budget} credits of equipment.` });
    s.history.push(snapshot(s, { gen: 0, load: 0, sun: sc.sun[0], shed: [] }));
    return s;
  }

  function snapshot(s, x) {
    return { day: s.day, o2: r1(s.o2), water: r1(s.water), food: r1(s.food), battery: r1(s.battery), batteryCap: batteryCap(s),
      health: Math.round(s.health), morale: Math.round(s.morale), gen: r1(x.gen), load: r1(x.load), sun: x.sun, shed: x.shed || [] };
  }

  /* ---------- daily rates (pure, used for forecasts + simulation) ---------- */
  function rates(s, day) {
    day = day || s.day; const L = s.levels, m = s.mods, pw = powerOf(s);
    const sun = sunOf(s)[day - 1] ?? 1;
    const gen = P.solarPerLevel * L.solar * sun * (m.solarDerateUntil >= day ? .5 : 1);
    const recOn = !(m.recyclerOffUntil >= day) && pw.recycler;
    const ghFactor = m.ghReducedUntil >= day ? .5 : 1;
    const loads = { base: P.baseLoad, oxygen: pw.oxygen ? P.o2Load * L.oxygen : 0, recycler: recOn ? P.recLoad * L.recycler : 0,
      greenhouse: pw.greenhouse ? P.ghLoad * L.greenhouse * ghFactor : 0, research: pw.research ? P.researchLoad : 0 };
    const load = Object.values(loads).reduce((a, b) => a + b, 0);
    return { sun, gen, loads, load, recOn, ghFactor, power: pw };
  }

  function simulateDay(s) {
    const day = s.day, L = s.levels, m = s.mods, pw = powerOf(s);
    const R = rates(s, day);
    const before = { o2: s.o2, water: s.water, food: s.food, battery: s.battery };
    // energy: battery cannot go below 0 or above capacity; shortfalls shed loads in a fixed priority order
    let battery = s.battery + R.gen - R.load;
    const shed = []; const frac = { research: 1, greenhouse: 1, recycler: 1, oxygen: 1 }; let baseUnmet = false;
    if (battery < 0) {
      let deficit = -battery; battery = 0;
      for (const k of ['research', 'greenhouse', 'recycler', 'oxygen']) {
        if (deficit <= 0 || !R.loads[k]) continue;
        const cut = Math.min(deficit, R.loads[k]);
        frac[k] = 1 - cut / R.loads[k]; deficit -= cut; shed.push(k);
      }
      if (deficit > 0.001) { baseUnmet = true; s.health -= 6; }
    }
    const cap = batteryCap(s), curtailed = Math.max(0, battery - cap);
    battery = Math.min(battery, cap);
    // water first, so electrolysis can only use water that exists
    const used = P.waterPerCrew * CREW;
    const recovered = R.recOn ? used * P.recRate[L.recycler] * frac.recycler : 0;
    const ghActive = L.greenhouse > 0 && pw.greenhouse && !(m.ghDeadUntil >= day);
    const ghWater = ghActive ? P.ghWater * L.greenhouse * R.ghFactor * frac.greenhouse : 0;
    const waterLeft = s.water - (used - recovered) - ghWater;
    const o2Need = P.o2PerCrew * CREW;
    const o2Max = pw.oxygen ? P.o2Gen[L.oxygen] * frac.oxygen : 0;
    let o2Made = Math.min(o2Max, Math.max(0, waterLeft) / P.electrolysis);
    const waterLimited = o2Made < o2Max - 1e-6;
    if (s.o2 + o2Made - o2Need > CAPS.o2) o2Made = Math.max(0, CAPS.o2 - s.o2 + o2Need);
    const waterDelta = -(used - recovered) - ghWater - o2Made * P.electrolysis;
    // food: unlit beds before first harvest delay maturity by a day
    if (L.greenhouse > 0 && !pw.greenhouse && day < (m.ghMatureDay || P.ghMature)) m.ghMatureDay = (m.ghMatureDay || P.ghMature) + 1;
    const mature = day >= (m.ghMatureDay || P.ghMature);
    const grown = ghActive && mature ? P.ghYield[L.greenhouse] * R.ghFactor * frac.greenhouse : 0;
    const foodDelta = grown - P.foodPerCrew * CREW;

    s.battery = battery;
    s.o2 = clamp(s.o2 + o2Made - o2Need, 0, CAPS.o2);
    s.water = clamp(s.water + waterDelta, 0, CAPS.water);
    s.food = clamp(s.food + foodDelta, 0, CAPS.food);
    if (shed.length) { s.brownoutDays++; s.morale -= 3; s.log.push({ day, type: 'alert', text: `Power shortfall — ${shed.join(', ')} throttled to protect the battery.`, cause: 'Consumption exceeded generation with an empty battery.' }); }
    if (baseUnmet) s.log.push({ day, type: 'alert', text: 'Habitat heaters under-powered.', cause: 'Even after shedding every optional load, the habitat base load could not be met. Crew health fell.' });
    if (grown > 0) s.morale += 1;
    let ok = true;
    if (s.water <= 0) { s.health -= 15; ok = false; }
    if (s.food <= 0) { s.health -= 10; ok = false; }
    if (ok && !shed.length && !baseUnmet) s.health += 2;
    s.health = clamp(s.health, 0, 100); s.morale = clamp(s.morale, 0, 100);
    s.minO2Ratio = Math.min(s.minO2Ratio, s.o2 / CAPS.o2);
    // science: needs research power, no shortfall, crew fit
    let sci = null;
    const paused = m.sciencePausedUntil >= day;
    if (!paused && pw.research && !shed.length && s.health > 40) {
      const o = s.objectives.find(x => !x.done);
      if (o) {
        o.progress++; const def = OBJECTIVES.find(x => x.id === o.id); sci = def.name;
        if (o.progress >= def.days) { o.done = true; s.credits += P.objectiveCredits; s.morale += 4;
          s.log.push({ day, type: 'objective', text: `Objective complete — ${def.name}. +${P.objectiveCredits} credits.` }); }
      }
    }
    // plain-language explanation of the day (shown as "What changed / Why")
    const why = [];
    if (R.sun === 0) why.push('No sunlight today, so the solar arrays made nothing and every system ran on the battery.');
    else if (R.sun < .5) why.push(`Sunlight was only ${Math.round(R.sun * 100)}%, so the arrays made less power.`);
    if (shed.length) why.push(`The battery ran empty, so the outpost automatically cut ${shed.join(', ')}.`);
    if (baseUnmet) why.push('There was not enough power to keep the habitat warm. Crew health dropped.');
    if (!pw.oxygen && L.oxygen) why.push('You switched the oxygen generator off, so the crew breathed from the tank.');
    if (waterLimited && !shed.includes('oxygen')) why.push('There was not enough water to run the oxygen generator at full speed.');
    if (!R.recOn && L.recycler) why.push('The water recycler was off, so used water was lost instead of cleaned.');
    if (!pw.research) why.push('Research was paused to save power, so science did not move forward.');
    else if (paused) why.push('The crew was sheltering, so science paused.');
    if (curtailed > 1) why.push(`The battery was full, so ${Math.round(curtailed)} kWh of solar energy could not be stored.`);
    if (grown > 0) why.push(`The greenhouse harvested ${r1(grown)} kg of food.`);
    s.lastDay = { day, delta: { o2: r1(s.o2 - before.o2), water: r1(s.water - before.water), food: r1(s.food - before.food), battery: r1(s.battery - before.battery) }, why, science: sci };
    return { gen: R.gen, load: R.load, sun: R.sun, shed };
  }

  /* ---------- events ---------- */
  const SRC = {
    radiation: { label: 'NASA NTRS — Deep Space Radiation Measurements and Crew Radiation Protection for Artemis', url: 'https://ntrs.nasa.gov/citations/20250002757' },
    eclss: { label: 'NASA Marshall — Environmental Control and Life Support System fact sheet (PDF)', url: 'https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf' },
    power: { label: 'NASA Glenn — Fission Surface Power Project Energizes Lunar Exploration', url: 'https://www.nasa.gov/centers-and-facilities/glenn/nasas-fission-surface-power-project-energizes-lunar-exploration' },
    plants: { label: 'NASA — Growing Plants in Space', url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/' },
  };

  function stormDose(s, choice) {
    const pf = P.shieldPF[s.levels.shielding];
    const H = P.stormHazard * (TIER[s.spaceWeather && s.spaceWeather.tier] || 1) * ((s.mods && s.mods.stormMag) || 1);
    if (choice === 'reinforce') return H * (1 - Math.min(.97, pf + .5));
    if (choice === 'shelter') return H * (1 - Math.min(.95, pf + .3));
    if (choice === 'procedures') return H * (1 - pf) * .6;
    return H * (1 - pf);
  }

  const EVENTS = {
    storm: {
      title: 'Solar Storm Warning', severity: 'critical', icon: 'sun', kind: 'Space weather', resources: ['radiation', 'health', 'power'],
      situation: s => `Monitoring satellites report a solar particle event heading toward the Moon. Your shelter rating is "${EQUIPMENT[2].effect(s.levels.shielding)}". Two crew members are outside on a surface traverse.`,
      science: 'Beyond Earth\u2019s magnetic field, solar particle events can sharply raise radiation exposure. Real missions answer with forecasting, shielding mass, and storm-shelter procedures. Real measurement: radiation detectors flown inside NASA-catalogued spaceflight experiments (OSDR environmental data, BION-M1) recorded about 0.6 to 1.4 milligray of absorbed dose every single day — even on quiet days. In this game, exposure is an abstract risk index — not a real dose.',
      finding: { label: 'NASA OSDR — Environmental Data: BION-M1 radiation dosimetry', url: 'https://www.nasa.gov/reference/osdr-environmental-data/' },
      source: SRC.radiation,
      choices: [
        { id: 'shelter', label: 'Move the crew to the protected shelter', safe: true,
          preview: s => [['Exposure risk', `+${r1(stormDose(s, 'shelter'))}`, 'good'], ['Science', 'Paused 2 days', 'warn'], ['Morale', '−2', 'warn']],
          apply: s => { const d = stormDose(s, 'shelter'); s.exposure += d; s.health -= d * 1.5; s.mods.sciencePausedUntil = s.day + 1; s.morale -= 2;
            return { tone: 'success', title: 'Crew sheltered safely', text: `The crew rode out the storm in the shelter. Exposure index +${r1(d)}. Surface science resumes on day ${s.day + 2}.` }; } },
        { id: 'reinforce', label: 'Reinforce the shelter: pump water into its walls using tonight’s battery', safe: true, needsBattery: 15,
          preview: s => [['Exposure risk', `+${r1(stormDose(s, 'reinforce'))}`, 'good'], ['Battery tonight', `−${Math.round(Math.min(P.reinforceKwh, s.battery))} kWh`, 'bad'], ['Science', 'Paused 2 days', 'warn']],
          apply: s => { const d = stormDose(s, 'reinforce'), used = Math.min(P.reinforceKwh, s.battery); s.battery -= used; s.exposure += d; s.health -= d * 1.5; s.mods.sciencePausedUntil = s.day + 1; s.morale -= 2;
            return { tone: s.battery < 10 ? 'warning' : 'success', title: 'Shelter reinforced', text: `The water walls blocked most of the storm (exposure +${r1(d)}). The pumps used ${Math.round(used)} kWh, so the battery starts tonight at ${Math.round(s.battery)} kWh.` }; } },
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
      situation: s => `A power-distribution unit has tripped, cutting array output in half until it is repaired. Battery is at ${Math.round(s.battery)} of ${batteryCap(s)} kWh, and sunlight at the site is ${Math.round((SUN[s.day - 1] || 1) * 100)}% of peak.`,
      science: 'Every life-support system depends on electricity. When power is short, engineers shed loads in priority order: crew survival first, experiments last.',
      source: SRC.power,
      choices: [
        { id: 'prioritize', label: 'Prioritize essential life-support systems', safe: true,
          preview: s => [['Greenhouse', 'Half power 3 days', 'warn'], ['Science', 'Paused 2 days', 'warn'], ['Array output', '−50% for 3 days', 'bad']],
          apply: s => { s.mods.solarDerateUntil = s.day + 2; s.mods.ghReducedUntil = s.day + 2; s.mods.sciencePausedUntil = s.day + 1;
            return { tone: 'warning', title: 'Essential loads protected', text: 'Nonessential loads were shed while the crew rerouted power. Arrays run at half output for 3 days.' }; } },
        { id: 'backup', label: 'Use backup energy reserves', safe: true,
          preview: s => [['Battery', `−${Math.round(s.battery * .4)} kWh`, 'bad'], ['Array output', '−50% for 2 days', 'bad']],
          apply: s => { s.battery *= .6; s.mods.solarDerateUntil = s.day + 1;
            return { tone: 'warning', title: 'Running on reserves', text: 'Operations continue normally, but the battery margin is thinner for the coming days.' }; } },
        { id: 'repair', label: 'Spend 10 credits on an immediate repair', safe: true, cost: 10,
          preview: s => [['Credits', '−10', 'warn'], ['Array output', 'Restored', 'good']],
          apply: s => { s.credits -= 10; s.log.push({ day: s.day, type: 'repair', text: 'Power-distribution unit replaced (10 credits).' });
            return { tone: 'success', title: 'Repair complete', text: 'A spare unit was installed. Full array output is restored.' }; } },
      ],
    },
    leak: {
      title: 'Water Leak Detected', severity: 'warning', icon: 'droplets', kind: 'Equipment failure', resources: ['water'],
      situation: s => `Pressure sensors show a slow leak in the water-processor loop. Reserves stand at ${Math.round(s.water)} L. Left alone, the loop loses about 10 L per day.`,
      science: 'Water is heavy to launch and hard to replace. Closed-loop recovery systems on the International Space Station recover about 98% of water — but a leak bypasses recycling entirely.',
      source: SRC.eclss,
      choices: [
        { id: 'shutdown', label: 'Shut down the affected system', safe: true,
          preview: s => [['Water recycling', 'Offline 2 days', 'bad'], ['Water', `≈ −${Math.round(P.waterPerCrew * CREW * P.recRate[s.levels.recycler] * 2)} L extra`, 'warn']],
          apply: s => { s.mods.recyclerOffUntil = s.day + 1;
            return { tone: 'warning', title: 'Loop isolated', text: 'The recycler is offline for 2 days while seals cure. Water loss increases temporarily.' }; } },
        { id: 'reserves', label: 'Draw on emergency reserves', safe: true,
          preview: s => [['Water', '−40 L', 'bad'], ['Recycling', 'Stays online', 'good']],
          apply: s => { s.water = Math.max(0, s.water - 40);
            return { tone: 'warning', title: 'Reserves used', text: 'The leak was bypassed using reserve plumbing. 40 L were lost in the process.' }; } },
        { id: 'repair', label: 'Repair the system (8 credits + 15 L)', safe: true, cost: 8,
          preview: s => [['Credits', '−8', 'warn'], ['Water', '−15 L', 'warn']],
          apply: s => { s.credits -= 8; s.water = Math.max(0, s.water - 15); s.log.push({ day: s.day, type: 'repair', text: 'Water-processor seal replaced (8 credits).' });
            return { tone: 'success', title: 'Leak repaired', text: 'The seal was replaced. Recycling continues at full rate.' }; } },
      ],
    },
    crop: {
      title: 'Greenhouse Crop Failure', severity: 'warning', icon: 'sprout', kind: 'Biological', resources: ['food'],
      situation: s => `A root-zone watering fault has damaged part of the crop. Food reserves are ${Math.round(s.food)} kg; the crew eats ${P.foodPerCrew * CREW} kg per day.`,
      science: 'Plants need light, water, nutrients and air delivered in balance around their roots. Growing food in space is possible, but it is slow and sensitive to equipment faults.',
      source: SRC.plants,
      choices: [
        { id: 'reallocate', label: 'Clear the beds and replant', safe: true,
          preview: s => [['Greenhouse', `No harvest for 6 days`, 'bad'], ['Morale', '−4', 'warn']],
          apply: s => { s.mods.ghDeadUntil = s.day + 1; s.mods.ghMatureDay = s.day + 6; s.morale -= 4;
            return { tone: 'warning', title: 'Crop replanted', text: `New seedlings are in. Next harvest expected on day ${s.day + 6}.` }; } },
        { id: 'recover', label: 'Attempt recovery of the damaged plants', safe: true, uncertain: true,
          preview: s => [['Outcome', 'Uncertain (~60% chance)', 'warn'], ['Water', '−15 L', 'warn']],
          apply: s => { s.water = Math.max(0, s.water - 15); const ok = ((s.seed * 9301 + s.day * 49297) % 233280) / 233280 < .6;
            if (ok) return { tone: 'success', title: 'Crop recovered', text: 'Most plants survived after the watering fault was fixed. Harvests continue.' };
            s.mods.ghDeadUntil = s.day + 1; s.mods.ghMatureDay = s.day + 6;
            return { tone: 'failure', title: 'Recovery failed', text: `The plants could not be saved. Beds were replanted; next harvest on day ${s.day + 6}.` }; } },
        { id: 'reduce', label: 'Reduce nonessential food-production demands', safe: true,
          preview: s => [['Greenhouse', 'Half output 5 days', 'warn'], ['Power', `−${P.ghLoad * s.levels.greenhouse / 2} kWh/day`, 'good']],
          apply: s => { s.mods.ghReducedUntil = s.day + 4;
            return { tone: 'warning', title: 'Greenhouse scaled back', text: 'Only healthy beds stay lit for 5 days. Output and power use are halved.' }; } },
      ],
    },
  };

  const SCHEDULE = [
    { day: 6, id: 'storm', forecastFrom: 3 },
    { day: 9, id: 'leak' },
    { day: 13, id: 'power' },
    { day: 18, id: 'crop', requires: s => s.levels.greenhouse > 0 },
    { day: 22, id: 'storm', forecastFrom: 19 },
  ];

  function forecast(s) {
    const out = scheduleOf(s).filter(e => e.forecastFrom && s.day >= e.forecastFrom && s.day < e.day)
      .map(e => ({ day: e.day, kind: 'storm', title: 'Space weather watch', text: `A solar storm may arrive around day ${e.day}. Forecasts are not certain, so prepare anyway.` }));
    const sun = sunOf(s), dark = sun.findIndex((v, i) => i + 1 > s.day && v === 0);
    if (dark >= 0 && sun[s.day - 1] > 0 && dark + 1 - s.day <= 4) out.push({ day: dark + 1, kind: 'night', title: 'Sunset approaching', text: `Lunar night begins on day ${dark + 1}. Arrays will produce nothing for about 14 days.` });
    return out;
  }

  const WHY = {
    'storm:shelter': 'Extra mass between the crew and the particles blocks most of the hazard. You traded a little science time for safety.',
    'storm:reinforce': 'Water is a good radiation shield. Pumping it into the shelter walls blocked more of the storm, but the pumps drained the battery just before night.',
    'storm:procedures': 'Staying indoors helped, but ordinary habitat walls block less than the dedicated shelter.',
    'storm:continue': 'Outside the shelter, more of the storm reached the crew. Science gained a day; crew safety paid for it.',
    'power:prioritize': 'Cutting the greenhouse and science protected life support while array output was halved.',
    'power:backup': 'The battery covered the loss today, but left less margin for the days ahead.',
    'power:repair': 'Spending credits fixed the fault right away — credits you can no longer spend on upgrades.',
    'leak:shutdown': 'Isolating the loop stopped the leak, but without recycling every litre the crew used was lost.',
    'leak:reserves': 'Bypassing the leak kept recycling running, but cost reserve water.',
    'leak:repair': 'The repair cost credits and some water, but kept the water loop efficient.',
    'crop:reallocate': 'Replanting restarts the growth clock — food takes time to grow.',
    'crop:recover': 'Recovery is a gamble on whether the roots survived.',
    'crop:reduce': 'Less light means less food, but also less power and water used.',
  };

  function eventView(s) {
    if (!s.pendingEvent) return null;
    const E = EVENTS[s.pendingEvent];
    const sw = s.spaceWeather;
    const basis = s.pendingEvent !== 'storm' ? null : sw && sw.status !== 'curated'
      ? { status: sw.status, label: sw.label, detail: sw.detail, url: sw.url || null, tier: sw.tier, fetchedAt: sw.fetchedAt,
          note: 'This storm is a game event inspired by a real NASA DONKI record. DONKI catalogs solar events; it does not measure radiation at the Moon, so the exposure numbers here are illustrative.' }
      : { status: 'curated', label: 'Predefined educational scenario', detail: 'No NASA space-weather record is attached to this mission.', url: null, tier: 'elevated',
          note: 'This storm is a built-in teaching scenario. Exposure numbers are illustrative, not real doses.' };
    return { id: s.pendingEvent, title: E.title, severity: E.severity, kind: E.kind, icon: E.icon, resources: E.resources,
      situation: E.situation(s), science: E.science, source: E.source, finding: E.finding || null, basis, advice: s.advice && s.advice.event === s.pendingEvent ? s.advice : null, comms: COMMS[s.comms || 'moon'],
      choices: E.choices.map(c => ({ id: c.id, label: c.label, safe: c.safe, uncertain: !!c.uncertain,
        disabled: c.cost ? s.credits < c.cost : c.needsBattery ? s.battery < c.needsBattery : false, cost: c.cost || 0,
        reason: c.cost && s.credits < c.cost ? `Needs ${c.cost} credits` : c.needsBattery && s.battery < c.needsBattery ? `Needs ${c.needsBattery} kWh in the battery` : '',
        preview: c.preview(s).map(([label, value, tone]) => ({ label, value, tone })) })) };
  }

  function resolveEvent(s0, choiceId) {
    const s = clone(s0); const E = EVENTS[s.pendingEvent]; const c = E.choices.find(x => x.id === choiceId);
    if (!c || (c.cost && s.credits < c.cost)) return s0;
    const outcome = c.apply(s);
    s.log.push({ day: s.day, type: 'decision', text: `${E.title}: ${c.label}.`, cause: outcome.text, tone: outcome.tone, unsafe: !c.safe });
    s.lastOutcome = Object.assign({ event: E.title, why: WHY[s.pendingEvent + ':' + choiceId] || '' }, outcome);
    (s.decisions = s.decisions || []).push({ day: s.day, event: s.pendingEvent, title: E.title, choice: choiceId, label: c.label, safe: c.safe, tone: outcome.tone });
    s.pendingEvent = null; s.advice = null; s.health = clamp(s.health, 0, 100); s.morale = clamp(s.morale, 0, 100);
    checkEnd(s);
    return s;
  }

  function checkEnd(s) {
    if (s.status !== 'active') return;
    if (s.o2 <= 0) { s.status = 'failed'; s.failure = { day: s.day, system: 'Oxygen', text: 'Oxygen reserves ran out. The crew was evacuated to the return vehicle and the mission was aborted.' }; }
    else if (s.health <= 0) { s.status = 'failed'; s.failure = { day: s.day, system: 'Crew health', text: 'Crew health fell too low to continue. Mission control ordered an early return.' }; }
  }

  function advanceDay(s0) {
    if (s0.status !== 'active' || s0.pendingEvent) return s0;
    const s = clone(s0); s.lastOutcome = null;
    const x = simulateDay(s);
    checkEnd(s);
    if (s.status === 'active') {
      s.day++;
      const D = daysOf(s);
      if (s.day > D) { s.day = D; s.status = 'complete'; s.log.push({ day: D, type: 'objective', text: 'Mission duration complete. Crew handover to relief team.' }); }
      else {
        s.fired = s.fired || [];
        const sched = scheduleOf(s);
        sched.forEach((e, i) => { if (e.falseAlarm && e.day === s.day && !s.fired.includes(i)) { s.fired.push(i);
          s.log.push({ day: s.day, type: 'decision', text: 'Storm watch ended: the solar storm missed the Moon.', cause: 'Space-weather forecasts are not certain. Some warnings never arrive.' });
          if (s.lastDay) s.lastDay.why.unshift(`Good news: the solar storm forecast for day ${s.day} missed the Moon. Forecasts are not always right.`); } });
        const idx = sched.findIndex((e, i) => !e.falseAlarm && e.day === s.day && !s.fired.includes(i) && (e.id !== 'crop' || s.levels.greenhouse > 0));
        if (idx >= 0) { const ev = sched[idx]; s.fired.push(idx); if (ev.mag) s.mods.stormMag = ev.mag; s.pendingEvent = ev.id; s.log.push({ day: s.day, type: 'event', text: EVENTS[ev.id].title, severity: EVENTS[ev.id].severity }); }
      }
    } else s.log.push({ day: s.day, type: 'failure', text: s.failure.text });
    s.history.push(snapshot(s, x));
    return s;
  }

  function purchase(s0, id) {
    const s = clone(s0); const lvl = s.levels[id]; const cost = nextCost(id, lvl);
    if (cost == null || s.credits < cost) return s0;
    s.credits -= cost; s.levels[id]++;
    if (id === 'reserves') { s.food = Math.min(CAPS.food, s.food + 50); s.water = Math.min(CAPS.water, s.water + 60); s.o2 = Math.min(CAPS.o2, s.o2 + 25); }
    const e = EQUIPMENT.find(x => x.id === id);
    s.log.push({ day: s.day, type: 'purchase', text: `${e.name} upgraded to level ${s.levels[id]} (${cost} credits).` });
    return s;
  }

  function adviceFor(s) {
    const id = s.pendingEvent;
    if (id === 'storm') return s.battery >= 30
      ? { recommend: 'reinforce', text: 'Get everyone into the shelter. You have enough battery to pump water into the walls — that blocks the most radiation. Expect a low battery tonight.' }
      : { recommend: 'shelter', text: 'Get everyone into the shelter now. Your battery is too low to run the wall pumps safely tonight.' };
    if (id === 'power') return s.credits >= 10 ? { recommend: 'repair', text: 'You can afford the spare part. Fixing it now keeps full solar power for the days ahead.' } : { recommend: 'prioritize', text: 'You can’t afford the repair. Protect life support first and cut the greenhouse and science for a few days.' };
    if (id === 'leak') return s.credits >= 8 ? { recommend: 'repair', text: 'A repair costs credits and a little water, but keeps your recycler working at full speed.' } : { recommend: 'shutdown', text: 'Shut the loop down for two days. You’ll lose some water, but the leak stops.' };
    if (id === 'crop') { const ok = ((s.seed * 9301 + s.day * 49297) % 233280) / 233280 < .6;
      return ok ? { recommend: 'recover', text: 'Our sensors show the roots are still healthy. Trying to recover the plants will work today.' } : { recommend: 'reallocate', text: 'Our sensors show the roots are badly damaged. Recovery will fail — replant instead.' }; }
    return { recommend: null, text: 'Follow your training.' };
  }
  function setComms(s0, mode) { if (!COMMS[mode] || s0.comms === mode) return s0; const s = clone(s0); s.comms = mode; if (s.advice && s.advice.status !== 'ready') s.advice = null; s.log.push({ day: s.day, type: 'decision', text: `Communication set to ${COMMS[mode].label}.`, cause: COMMS[mode].note }); return s; }
  function requestAdvice(s0) {
    if (!s0.pendingEvent || (s0.advice && s0.advice.event === s0.pendingEvent)) return s0;
    const s = clone(s0), mode = s.comms || 'moon';
    s.advice = { event: s.pendingEvent, askedDay: s.day, mode, status: mode === 'moon' ? 'transit' : 'waiting', recommend: null, text: '' };
    s.log.push({ day: s.day, type: 'decision', text: 'Asked Mission Control on Earth for advice.', cause: COMMS[mode].note });
    return s;
  }
  function receiveAdvice(s0) {
    if (!s0.advice || s0.advice.status !== 'transit') return s0;
    const s = clone(s0); Object.assign(s.advice, adviceFor(s), { status: 'ready' }); return s;
  }
  function waitForReply(s0) {
    if (s0.status !== 'active' || !s0.advice || s0.advice.status !== 'waiting' || s0.day >= daysOf(s0)) return s0;
    const s = clone(s0); const x = simulateDay(s);
    if (s.pendingEvent === 'storm') { const d = stormDose(s, 'procedures') * .5; s.exposure += d; s.health = clamp(s.health - d * 1.5, 0, 100);
      s.lastDay.why.unshift(`While you waited for Earth, the storm kept going. The crew stayed indoors but took extra exposure (+${r1(d)}).`); }
    s.lastDay.why.unshift('You waited one full day for Mission Control’s reply. The base used a day of air, water, food and power.');
    checkEnd(s);
    if (s.status === 'active') { s.day++; Object.assign(s.advice, adviceFor(s), { status: 'ready' }); }
    else s.log.push({ day: s.day, type: 'failure', text: s.failure.text });
    s.log.push({ day: s.day, type: 'decision', text: 'Earth’s reply arrived after a one-day wait.', cause: 'At Mars distance, a question and its answer take minutes to cross space each way.' });
    s.history.push(snapshot(s, x));
    return s;
  }
  function bonusInfo(s) {
    const o = s.objectives.find(x => !x.done);
    const reason = s.status !== 'active' ? 'Mission ended' : s.pendingEvent ? 'Handle the emergency first' : !o ? 'All science jobs done' : s.bonusDay === s.day ? 'Already done today' : s.o2 < P.bonusO2 + 5 ? 'Not enough spare oxygen' : '';
    return { available: !reason, reason, o2: P.bonusO2, job: o ? OBJECTIVES.find(d => d.id === o.id).name : null };
  }
  function bonusExperiment(s0) {
    if (!bonusInfo(s0).available) return s0;
    const s = clone(s0), o = s.objectives.find(x => !x.done), def = OBJECTIVES.find(d => d.id === o.id);
    s.o2 -= P.bonusO2; s.bonusDay = s.day; o.progress++; s.morale = clamp(s.morale + 1, 0, 100);
    s.log.push({ day: s.day, type: 'decision', text: `Bonus spacewalk experiment: ${def.name}.`, cause: `Refilling the spacesuits used ${P.bonusO2} kg of oxygen.` });
    (s.decisions = s.decisions || []).push({ day: s.day, event: 'bonus', title: 'Bonus experiment', choice: 'eva', label: 'Bonus spacewalk experiment', safe: true, tone: 'info' });
    if (o.progress >= def.days) { o.done = true; s.credits += P.objectiveCredits; s.morale = clamp(s.morale + 4, 0, 100); s.log.push({ day: s.day, type: 'objective', text: `Objective complete — ${def.name}. +${P.objectiveCredits} credits.` }); }
    return s;
  }

  function setPower(s0, key, on) {
    if (s0.status !== 'active' || !(key in POWER_KEYS)) return s0;
    const pw = powerOf(s0); if (pw[key] === !!on) return s0;
    const s = clone(s0); s.power = Object.assign(pw, { [key]: !!on });
    const cost = { oxygen: P.o2Load * s.levels.oxygen, recycler: P.recLoad * s.levels.recycler, greenhouse: P.ghLoad * s.levels.greenhouse, research: P.researchLoad }[key];
    s.log.push({ day: s.day, type: 'decision', text: `${POWER_KEYS[key]} switched ${on ? 'on' : 'off'}.`, cause: on ? `Adds ${cost} kWh/day of demand.` : `Saves ${cost} kWh/day of power.` });
    (s.decisions = s.decisions || []).push({ day: s.day, event: 'power', title: POWER_KEYS[key], choice: on ? 'on' : 'off', label: `${POWER_KEYS[key]} ${on ? 'on' : 'off'}`, safe: true, tone: 'info' });
    return s;
  }

  /* ---------- derived views ---------- */
  function resources(s) {
    const R = rates(s);
    const pw = powerOf(s), o2Prod = pw.oxygen ? P.o2Gen[s.levels.oxygen] : 0;
    const o2Net = o2Prod - P.o2PerCrew * CREW;
    const used = P.waterPerCrew * CREW;
    const rec = R.recOn ? used * P.recRate[s.levels.recycler] : 0;
    const waterNet = -(used - rec) - (s.levels.greenhouse && pw.greenhouse ? P.ghWater * s.levels.greenhouse * R.ghFactor : 0) - o2Prod * P.electrolysis;
    const ghOn = s.levels.greenhouse > 0 && pw.greenhouse && !(s.mods.ghDeadUntil >= s.day) && s.day >= (s.mods.ghMatureDay || P.ghMature);
    const foodProd = ghOn ? P.ghYield[s.levels.greenhouse] * R.ghFactor : 0;
    const foodNet = foodProd - P.foodPerCrew * CREW;
    const powNet = R.gen - R.load;
    const cap = batteryCap(s);
    const st = (val, capv, net) => {
      const days = net < 0 ? val / -net : Infinity; const ratio = val / capv;
      return { days, status: (days < 4 || ratio < .1) ? 'critical' : (days < 9 || ratio < .25) ? 'warning' : 'stable' };
    };
    const o2 = st(s.o2, CAPS.o2, o2Net), w = st(s.water, CAPS.water, waterNet), f = st(s.food, CAPS.food, foodNet), p = st(s.battery, cap, powNet);
    const rad = (() => { const fc = forecast(s).filter(f => f.kind === 'storm'); const risk = s.pendingEvent === 'storm' ? 'Storm' : fc.length ? 'Elevated' : 'Nominal';
      return { tier: EQUIPMENT[2].effect(s.levels.shielding), level: s.levels.shielding, risk, status: risk === 'Storm' ? 'critical' : (risk === 'Elevated' && s.levels.shielding < 2) ? 'warning' : 'stable' }; })();
    const exposureLabel = s.exposure < 4 ? 'Low' : s.exposure < 10 ? 'Moderate' : 'High';
    const crewStatus = s.health < 40 ? 'critical' : s.health < 70 || s.morale < 40 ? 'warning' : 'stable';
    return {
      o2: { value: s.o2, cap: CAPS.o2, net: o2Net, consumption: P.o2PerCrew * CREW, production: o2Prod, unit: 'kg', ...o2 },
      water: { value: s.water, cap: CAPS.water, net: waterNet, consumption: used, recycling: P.recRate[s.levels.recycler], recOn: R.recOn, unit: 'L', ...w },
      food: { value: s.food, cap: CAPS.food, net: foodNet, consumption: P.foodPerCrew * CREW, production: foodProd, unit: 'kg', ...f },
      power: { value: s.battery, cap, net: powNet, gen: R.gen, load: R.load, loads: R.loads, sun: R.sun, unit: 'kWh', ...p },
      radiation: rad, crew: { health: s.health, morale: s.morale, exposure: exposureLabel, status: crewStatus },
    };
  }

  function alerts(s) {
    const r = resources(s); const out = [];
    const name = { o2: 'Oxygen', water: 'Water', food: 'Food', power: 'Battery' };
    for (const k of ['o2', 'water', 'food', 'power']) {
      const x = r[k]; if (x.status === 'stable') continue;
      const d = isFinite(x.days) ? `about ${Math.max(0, Math.floor(x.days))} days remaining at the current rate` : 'below the safe threshold';
      out.push({ level: x.status, title: `${name[k]} ${x.status === 'critical' ? 'critical' : 'approaching warning threshold'}`, text: `${name[k]} reserves: ${d}.`, key: k });
    }
    if (r.power.sun < .5) out.push({ level: 'warning', title: 'Reduced solar generation', text: `Terrain shadowing has cut sunlight to ${Math.round(r.power.sun * 100)}% of peak.`, key: 'power' });
    if (r.radiation.risk === 'Elevated') out.push({ level: 'warning', title: 'Crew shelter preparation recommended', text: 'A space-weather watch is in effect.', key: 'radiation' });
    if (r.crew.status !== 'stable') out.push({ level: r.crew.status, title: 'Crew condition degraded', text: `Health ${Math.round(s.health)} · Morale ${Math.round(s.morale)}.`, key: 'crew' });
    return out.sort((a, b) => (a.level === 'critical' ? -1 : 1) - (b.level === 'critical' ? -1 : 1));
  }

  function insights(s) {
    const r = resources(s); const out = [];
    if (r.power.net < 0) out.push(`Energy reserves are declining because consumption (${Math.round(r.power.load)} kWh/day) exceeds generation (${Math.round(r.power.gen)} kWh/day). Consider reducing nonessential loads or upgrading storage.`);
    else out.push(`Arrays are producing a ${Math.round(r.power.net)} kWh/day surplus. Extra battery capacity would let you bank it for shadowed days.`);
    if (r.o2.net < 0) out.push(`Oxygen generation (${r.o2.production} kg/day) is below crew demand (${r.o2.consumption.toFixed(1)} kg/day). The tank is slowly draining.`);
    if (r.water.net < -6) out.push(`Water falls about ${Math.abs(r.water.net).toFixed(1)} L/day. Electrolysis for oxygen is one of the largest water draws.`);
    if (s.levels.greenhouse && s.day < (s.mods.ghMatureDay || P.ghMature)) out.push(`Greenhouse crops are still growing — first harvest expected on day ${s.mods.ghMatureDay || P.ghMature}.`);
    const dark = forecast(s).find(f => f.kind === 'night');
    if (dark) out.unshift(`Night starts on day ${dark.day}. Fill the battery now and plan which systems you can switch off.`);
    return out.slice(0, 3);
  }

  function score(s) {
    const done = s.objectives.filter(o => o.done).length;
    const r = resources(s);
    const minRatio = Math.min(s.o2 / CAPS.o2, s.water / CAPS.water, s.food / CAPS.food);
    const cats = [
      { id: 'crew', label: 'Crew safety', max: 350, value: Math.round((s.health * 2.5 + s.morale) * (s.status === 'failed' ? .5 : 1)), basis: `Final health ${Math.round(s.health)} × 2.5 + morale ${Math.round(s.morale)}${s.status === 'failed' ? ' · halved: crew evacuated early' : ''}` },
      { id: 'science', label: 'Science objectives', max: 300, value: done * 60, basis: `${done} of 5 objectives × 60` },
      { id: 'margins', label: 'Resource margins', max: 200, value: s.status === 'failed' ? 0 : Math.round(Math.min(1, minRatio / .3) * 200), basis: `Lowest reserve at ${Math.round(minRatio * 100)}% of capacity (full marks at 30%)` },
      { id: 'response', label: 'Emergency response', max: 150, value: Math.max(0, 150 - s.unsafe * 60), basis: `${s.unsafe} unsafe decision${s.unsafe === 1 ? '' : 's'} × −60` },
    ];
    const total = cats.reduce((a, c) => a + c.value, 0);
    const ach = [
      { id: 'life', name: 'Life Support Specialist', earned: s.minO2Ratio >= .2 && s.status !== 'failed', criterion: 'Oxygen never fell below 20% of capacity' },
      { id: 'energy', name: 'Energy Strategist', earned: s.brownoutDays === 0, criterion: 'No days with a power shortfall' },
      { id: 'conserve', name: 'Resource Conservation Expert', earned: s.levels.recycler >= 2 && s.water / CAPS.water >= .25, criterion: 'Recycler level 2+ and water above 25% at the end' },
      { id: 'emergency', name: 'Emergency Commander', earned: s.unsafe === 0 && s.log.some(l => l.type === 'decision' && l.text.includes(':')), criterion: 'Every emergency resolved with a safe choice' },
      { id: 'science', name: 'Mission Scientist', earned: done >= Math.min(4, scen(s).objectivesRequired + 1), criterion: `Complete ${Math.min(4, scen(s).objectivesRequired + 1)} or more science objectives` },
    ];
    const required = scen(s).objectivesRequired;
    const result = s.status === 'failed' ? 'failed' : s.status !== 'complete' ? 'active' : done >= required ? 'success' : 'partial';
    return { total, max: 1000, cats, achievements: ach, objectivesDone: done, minRatio, required, result, scenario: scen(s) };
  }

  /* ---------- persistence + demo ---------- */
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.v === 1) { lastScen = v.scenario || 'outpost'; return v; } return null; } catch (e) { return null; } }
  function loadScenario() { try { return localStorage.getItem(KEY + '.scenario') || 'outpost'; } catch (e) { return 'outpost'; } }
  function saveScenario(id) { if (!SCENARIOS[id]) return; lastScen = id; try { localStorage.setItem(KEY + '.scenario', id); } catch (e) {} }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} return s; }
  function loadConfig() { try { return JSON.parse(localStorage.getItem(KEY + '.config')) || null; } catch (e) { return null; } }
  function saveConfig(levels) { try { localStorage.setItem(KEY + '.config', JSON.stringify(levels)); } catch (e) {} }

  const PRESETS = {
    balanced: { solar: 1, battery: 1, shielding: 1, recycler: 1, greenhouse: 1, oxygen: 1, reserves: 0 },
    risky: { solar: 2, battery: 1, shielding: 0, recycler: 1, greenhouse: 1, oxygen: 0, reserves: 1 },
  };

  function autoplay(kind, scenario) {
    let s = newMission(PRESETS[kind === 'failure' ? 'risky' : 'balanced'], { scenario: scenario || 'outpost' });
    let guard = 0;
    while (s.status === 'active' && guard++ < 80) {
      if (s.pendingEvent) {
        const v = eventView(s);
        let pick = kind === 'failure' ? v.choices[v.choices.length - 1] : (v.choices.find(c => c.id === 'repair' && !c.disabled) || v.choices[0]);
        if (pick.disabled) pick = v.choices[0];
        s = resolveEvent(s, pick.id); continue;
      }
      if (kind !== 'failure') { if (s.credits >= 15 && s.levels.battery < 2) s = purchase(s, 'battery'); else if (s.credits >= 10 && s.day > 15 && s.levels.reserves < 1) s = purchase(s, 'reserves'); }
      s = advanceDay(s);
    }
    return s;
  }

  function ensure() {
    const v = load(); if (v) return v;
    const sc = loadScenario(); let cfg = loadConfig() || PRESETS.balanced;
    if (configCost(cfg) > SCENARIOS[sc].budget) cfg = PRESETS.balanced;
    return save(newMission(cfg, { scenario: sc, seed: Date.now() % 9973 }));
  }


const LQSim = { KEY, CREW, DAYS, BUDGET, SUN, P, CAPS, START, EQUIPMENT, OBJECTIVES, EVENTS, SCHEDULE, PRESETS, SCENARIOS, POWER_KEYS, TIER,
    sunOf, daysOf, scheduleOf, powerOf, setPower, COMMS, setComms, requestAdvice, receiveAdvice, waitForReply, bonusInfo, bonusExperiment, loadScenario, saveScenario, scenarioOf: scen,
    emptyLevels, configCost, nextCost, batteryCap, newMission, advanceDay, resolveEvent, purchase, rates,
    resources, alerts, insights, forecast, eventView, score, load, save, loadConfig, saveConfig, autoplay, ensure,
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} } };
export default LQSim;
