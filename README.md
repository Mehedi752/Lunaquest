# LunaQuest — Junior Astronaut Mission Simulator

> **Every Decision Shapes the Mission.**
> Built for the **NASA Space Apps Challenge 2026** · Challenge: *Build a Junior Astronaut Mission Trainer*

LunaQuest is a browser-based educational simulation that puts young learners in command of a four-person lunar outpost. Players spend a fixed 100-credit budget across seven interconnected life-support systems, then advance one simulated day at a time — managing oxygen, water, food, power and radiation while responding to random emergencies like solar storms, water leaks and power faults. Every number on screen comes from the same verifiable simulation engine, and every source is labelled as NASA data, NASA reference, simplified assumption or game rule.

**Team ZeroGravity** — Jashore University of Science and Technology (JUST), Bangladesh
Mehedi Hasan · Maimuna Rahman · Nahid Hasan · Joy Barua

---

## Table of Contents

1. [What we built and why](#1-what-we-built-and-why)
2. [How the simulation works](#2-how-the-simulation-works)
3. [Gameplay features](#3-gameplay-features)
4. [Scenarios](#4-scenarios)
5. [The Science Lab](#5-the-science-lab)
6. [Datasets & Data sources](#6-datasets--data-sources)
7. [NASA data used](#7-nasa-data-used)
8. [References](#8-references)
9. [Tech stack & libraries](#9-tech-stack--libraries)
10. [Architecture](#10-architecture)
11. [Routes](#11-routes)
12. [Running locally](#12-running-locally)
13. [Deployment](#13-deployment)
14. [Verification & tests](#14-verification--tests)
15. [Accessibility](#15-accessibility)
16. [Limitations & honest disclaimers](#16-limitations--honest-disclaimers)
17. [What we'd build next](#17-what-wed-build-next)

---

## 1. What we built and why

Junior learners rarely encounter the idea that **systems thinking** — not just individual facts — is what keeps a space crew alive. By giving students a fixed budget and letting them live with the consequences of every choice across 12–30 simulated days, LunaQuest makes abstract engineering trade-offs visible and personal.

The challenge asked for a junior astronaut mission trainer. We answered with a full decision loop:

1. **Configure** — Spend 100 credits across seven systems. Level 1 of everything costs 105, so something always has to give.
2. **Advance** — Press "Advance one day." Oxygen, water, food and power change by real daily rates. Sunlight fades when terrain shadows the site mid-mission.
3. **Decide** — Storms, leaks and faults arrive. Each choice previews its cost before you commit; the engine decides the outcome.
4. **Debrief** — See exactly how your score was calculated, what went wrong, and what to try next time.

---

## 2. How the simulation works

The core is a **pure TypeScript simulation engine** (`src/lib/sim/`) with no React dependency. It is the only place consequences are computed — every preview, every playthrough, every test runs the same code.

### Resource model (per day)

| Resource | Daily change | Source |
|---|---|---|
| Oxygen | −0.84 kg × crew (4) = −3.36 kg | NASA ECLSS fact sheet |
| Water | −3 L × crew = −12 L (offset by recycler recovery 75–95%) | NASA ECLSS fact sheet |
| Food | −1.8 kg × crew = −7.2 kg (offset by greenhouse from day 8) | Game rule |
| Battery | +Solar output − base load (14 kWh/day) − running systems | Game rule |
| O₂ electrolysis | 1 kg O₂ costs 1.125 kg water | 8:1 O:H mass ratio (NASA NTRS) |

### Sunlight profile

Each scenario uses an **illustrative illumination profile** (fraction of peak sunlight per day). The polar site profile includes a terrain-shadow dip around days 11–16 that tests battery reserves. The "First Lunar Night" scenario has 8 lit days followed by 14 dark days.

### Load-shedding order

When the battery runs low the outpost cuts loads in this order: greenhouse → water recycling → oxygen generation. If oxygen reaches zero or crew health reaches zero, the mission is aborted.

### Emergencies

Events are drawn from a seeded generator. Each event has:
- A **situation** that depends on current state (battery level, shielding tier, sunlight).
- 2–3 **choices**, each with a live consequence preview computed by the engine.
- An **outcome** that mutates state and writes to the mission log.

---

## 3. Gameplay features

- **Seven upgradeable systems:** Solar Arrays · Battery Storage · Oxygen Generation · Water Recycling · Greenhouse · Radiation Shielding · Emergency Reserves (each with 3 upgrade levels).
- **Random emergencies:** Solar storms (forecast 2–3 days ahead, some false alarms), water leaks, power faults, crop failures — each with choice previews.
- **Power switches:** Individually cut air, water recycling, grow lights or science to conserve power.
- **Bonus spacewalk:** Spend oxygen for a science bonus.
- **Reinforced shelter:** Spend battery charge to harden the habitat before a storm.
- **Science objectives:** Regolith sampling, seismometer deployment, polar ice prospecting, plant growth experiment, radiation mapping — each earns 12 credits to spend on upgrades.
- **Communication delay:** "Ask Mission Control" takes ~2.6 s at Moon distance. The **Mars-distance drill** (Settings ▸ Communication delay) makes Earth's reply arrive the next day.
- **NASA DONKI live data:** Storm severity (high / elevated / moderate) is set by the most recent real solar flare or particle event when a mission starts. Status is always shown as live, cached or unavailable — never invented.
- **Debrief scoring:** Crew safety · Science objectives · Resource margins · Emergency response — with sub-score breakdown.
- **Persistent state:** Zustand store in localStorage; resume across sessions.

---

## 4. Scenarios

| Scenario | Duration | Budget | Difficulty | Key lesson |
|---|---|---|---|---|
| **Lunar Outpost Alpha** | 30 days | 100 cr | Intermediate | General systems thinking; shadow dip mid-mission tests battery. |
| **First Lunar Night** | 24 days | 95 cr | Hard | 8 lit days then 14 dark — solar-only bases can't survive without deep battery reserves. |
| **Solar Weather Alert** | 12 days | 90 cr | Hard | A guaranteed X-class storm arrives early; shielding investment pays off immediately. |
| **Water Under Pressure** | 15 days | 85 cr | Explorer | A hidden leak depletes water faster than recycling can recover; oxygen runs short. |

> Mars Outpost is designed and shown as "In development" — gameplay is not yet implemented.

---

## 5. The Science Lab

Seven short modules at `/science`, each with:
- A question ("Where does a crew's air come from on a world with no atmosphere?")
- The game model (simplified) vs. real-world practice
- A live figure (chart or diagram)
- An honest simplification note
- A link to the NASA source

| Module | Topic | NASA source |
|---|---|---|
| 01 Life support | Oxygen generation, CO₂, ECLSS | NASA ECLSS fact sheet |
| 02 Radiation & shielding | SPE, shielding mass, storm shelters | NASA NTRS 20250002757 |
| 03 Energy | Solar arrays, lunar night, fission power | NASA Glenn Fission Surface Power |
| 04 Water recycling | Recovery rates, electrolysis | NASA ECLSS fact sheet |
| 05 Agriculture | LED grow systems, Veggie | NASA Veggie / Growing Plants in Space |
| 06 Habitat engineering | System interdependencies, ECLS | NASA NTRS ECLS |
| 07 Trade-offs | Fixed budget, mass/volume constraints | — |

---

## 6. Datasets & Data sources

Every source in LunaQuest is labelled with one of four kinds on the in-game `/sources` page:

| Label | Meaning |
|---|---|
| 🟢 **NASA data** | Records from a NASA database, queried or archived. |
| 🔵 **NASA reference** | Facts from NASA publications and feature articles. |
| 🟣 **Simplified assumption** | A real-world idea made simpler for the game. |
| 🟡 **Game rule** | A number we chose so the game is fair and learnable. |

### Full source list

| # | Kind | Name | Organisation | Date | Used for | Limits |
|---|---|---|---|---|---|---|
| 1 | 🟢 NASA data | **DONKI — Solar Flares (FLR) + Solar Energetic Particles (SEP)** | NASA / CCMC | Live, last 30 days | Sets in-game storm severity tier (high / elevated / moderate) when a mission starts. | Event catalog seen from Earth-Sun spacecraft — not a radiation measurement at the Moon. |
| 2 | 🟢 NASA data | **OSDR — BION-M1 radiation dosimetry dataset** | NASA Open Science Data Repository | Archived | Cited in Science Lab radiation module as a real measured dose (~0.6–1.4 mGy/day). Used as a contextual fact only. | Measured inside an uncrewed biosatellite in Earth orbit — not on astronauts, not on the Moon. Not used in calculations. |
| 3 | 🔵 NASA reference | **ECLSS — Environmental Control and Life Support System fact sheet (PDF, 2025)** | NASA Marshall Space Flight Center | 2025 | Per-astronaut O₂ (0.84 kg/day) and water (3 L/day) consumption; water recovery rate range (75–95%). | Space-station systems; LunaQuest uses lower recovery rates so upgrades matter. |
| 4 | 🔵 NASA reference | **Deep Space Radiation Measurements and Crew Radiation Protection for Artemis (NTRS 20250002757)** | NASA Technical Reports Server | 2025 | Explains why shielding mass and storm shelters protect crews during solar particle events. | Exposure in the game is an abstract risk index — no real dose is calculated. |
| 5 | 🔵 NASA reference | **Fission Surface Power Project Energizes Lunar Exploration** | NASA Glenn Research Center | NASA feature | Context for First Lunar Night: why solar-only bases struggle in prolonged darkness. | Fission power is not playable in this version. |
| 6 | 🔵 NASA reference | **Growing Plants in Space** | NASA | NASA feature | Greenhouse module: plants need balanced light, water and nutrients; real experiments grew crops on ISS. | Crop yields in the game are game values, not experiment results. |
| 7 | 🔵 NASA reference | **Veggie** | NASA Science | NASA feature | Same as above; confirms LED grow systems and crop types (lettuce, kale, zinnia). | Same as above. |
| 8 | 🔵 NASA reference | **Environmental Control and Life Support Systems (NTRS PDF)** | NASA NTRS | Archived | 8:1 oxygen-to-hydrogen mass ratio → 1 kg O₂ costs 1.125 kg water (electrolysis calc). | LunaQuest uses a rounded version; exact ratio depends on purity and conditions. |
| 9 | 🔵 NASA reference | **Moon Base artist's renderings (2026 gallery)** | NASA | 2026 | Background images in scenario cards, landing page and Mission Control. | Artist's concepts — not photographs or mission footage. |
| 10 | 🟣 Simplified assumption | **Lunar day/night cycle** | Physical fact, simplified | — | First Lunar Night: 8 sunlit days then 14 dark days. Polar scenarios use a terrain-shadow dip. | Real illumination depends on latitude and terrain; profiles are illustrative. |
| 11 | 🟣 Simplified assumption | **Earth–Moon communication delay** | Physical fact | — | "Ask Mission Control" ~2.6 s round trip. Mars-distance drill makes reply arrive next day. | Real Mars delays are minutes; the game compresses to one day. |
| 12 | 🟡 Game rule | **Budget, costs, yields, capacities, event chances** | LunaQuest team | v2 engine | Every credit cost, kWh, litre, kilogram and emergency probability. Listed on `/sources`. | Chosen for learning and balance — not engineering data. |

---

## 7. NASA Data Used

### Live API — NASA DONKI

- **Endpoints queried:** `https://api.nasa.gov/DONKI/FLR` and `https://api.nasa.gov/DONKI/SEP` (last 30 days); fallback to `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/`
- **API key:** Free key from [https://api.nasa.gov](https://api.nasa.gov); `DEMO_KEY` used if none is set.
- **Cache:** Server-side, 6-hour revalidation (`/api/space-weather` route).
- **Game interpretation (documented on `/sources`):**
  - SEP event in the last 30 days → severity **high** (×1.5 storm multiplier)
  - X-class flare (no SEP) → severity **elevated** (×1.0, default)
  - Smaller flares / quiet Sun → severity **moderate** (×0.6)
- **Transparency:** Live status badge (🟢 LIVE / 🔵 CACHED / 🟡 OFFLINE) is shown on the landing page, Mission Control and `/sources`. Data are never invented; if NASA is unreachable the game uses its built-in teaching scenario and says so.

### Archived Dataset — NASA OSDR BION-M1

- **Dataset:** Environmental radiation dosimetry from the BION-M1 biosatellite mission.
- **Used as:** A real measured figure (~0.6–1.4 mGy/day absorbed dose) cited in the Science Lab radiation module to give students a sense of scale.
- **Not used in calculations.** Presented as context only; the game's exposure index is abstract.

---

## 8. References

| # | Title | Link |
|---|---|---|
| 1 | NASA DONKI space weather API | https://ccmc.gsfc.nasa.gov/tools/DONKI/ |
| 2 | NASA api.nasa.gov (key registration) | https://api.nasa.gov |
| 3 | NASA OSDR BION-M1 radiation dataset | https://www.nasa.gov/reference/osdr-environmental-data/ |
| 4 | NASA Marshall — ECLSS fact sheet (PDF, 2025) | https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf |
| 5 | NASA NTRS 20250002757 — Artemis crew radiation protection | https://ntrs.nasa.gov/citations/20250002757 |
| 6 | NASA Glenn — Fission Surface Power Project | https://www.nasa.gov/centers-and-facilities/glenn/nasas-fission-surface-power-project-energizes-lunar-exploration |
| 7 | NASA — Growing Plants in Space | https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/ |
| 8 | NASA Science — Veggie | https://science.nasa.gov/mission/veggie/ |
| 9 | NASA NTRS — ECLS Systems PDF | https://ntrs.nasa.gov/api/citations/20210010644/downloads/132-1-Final.pdf |
| 10 | NASA Space Apps Challenge | https://www.spaceappschallenge.org/ |

---

## 9. Tech stack & libraries

| Package | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.15 | Full-stack React framework (App Router, server routes, ISR) |
| **TypeScript** | 5.6 (strict) | Type-safe codebase; 0 errors |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **shadcn/ui + Radix UI** | latest | Accessible UI primitives (dialogs, sliders, radio groups, tooltips) |
| **Zustand** | 4.5 | Client-side mission state, persisted to localStorage |
| **Recharts** | 2.13 | Resource timeline chart |
| **Three.js** | 0.160 | 3-D outpost scene (play-3d route) |
| **Lucide React** | 0.453 | Icon set |
| **Framer Motion** | 11.11 | Scroll-reveal animations on the landing page |
| **Geist** | 1.3 | Typography |
| **Vitest** | 2.1 | Engine unit tests (13 tests) |

---

## 10. Architecture

```
src/
├── lib/
│   ├── sim/                Pure TypeScript engine — no React.
│   │   ├── core.ts         Simulation core: advanceDay, resource deltas, event resolution
│   │   ├── data.ts         Constants (P), equipment, scenarios, objectives, sources
│   │   ├── events.ts       Emergency event definitions, choices, previews, stormDose()
│   │   ├── engine.ts       Typed public facade: newMission, advanceDay, resolveEvent,
│   │   │                   purchase, setPower, requestAdvice, autoplay…
│   │   ├── types.ts        All shared types (MissionState, EventView, Outcome…)
│   │   ├── colors.ts       Shared tone → color map
│   │   ├── index.ts        Re-exports
│   │   └── engine.test.ts  Vitest suite (13 tests, all 4 scenarios)
│   └── store.ts            Zustand store (persisted); thin wrapper over the engine
├── components/
│   ├── ui/                 shadcn/ui primitives themed with LunaQuest design tokens
│   └── lq/
│       ├── landing/        Landing page components + canvas animations
│       ├── mission/        Mission Control shell, topbar, resource cards, event dialog,
│       │                   advice panel, operations panel, schematic, guide
│       ├── game3d/         Three.js outpost scene
│       ├── day-by-day.tsx  Interactive walkthrough on the landing page
│       ├── systems-explorer.tsx
│       ├── tradeoff-demo.tsx
│       └── …
└── app/                    Next.js App Router routes (see Routes table below)
    └── api/
        └── space-weather/  Server route: NASA DONKI proxy, 6-hour cache
```

**Design principle:** The simulation engine is a pure function library. React components only call engine functions and read state from the Zustand store. This makes the engine fully testable without a browser.

---

## 11. Routes

| Route | Screen |
|---|---|
| `/` | Landing: hero, how a mission works, day-by-day walkthrough, systems flow diagram, trade-offs demo, scenarios, science & data, team |
| `/missions` | Mission selection — Moon (playable) · Mars (in development) |
| `/missions/lunar-alpha/briefing` | Mission briefing, crew manifest, readiness checklist |
| `/missions/lunar-alpha/configure` | Scenario picker (4 scenarios) + outpost configurator with live 30-day resource projection |
| `/mission` | Mission Control: goal bar, how-to-play guide, resource strip, outpost schematic, telemetry panel, event decision dialogs, power switches, bonus spacewalk, reinforced shelter, "What changed" daily report |
| `/mission/build` | Build & Upgrade Center (`?system=<id>` preselects a category) |
| `/mission/timeline` | Interactive Recharts resource chart, event inspector, full mission log |
| `/mission/debrief` | Scored debrief — success · partial success · failure — with sub-score explanations |
| `/science` | Science Lab — 7 modules each with game model, real-world practice, simplification note, NASA source link |
| `/sources` | Science & Data Sources: live NASA DONKI status, every source labelled by kind, all game parameters, known limitations |
| `/play-3d` | Three.js 3-D outpost scene |
| `/design-system` | Design tokens and component states |
| `/api/space-weather` | Server-side NASA DONKI proxy (FLR + SEP, last 30 days, 6-hour ISR cache) |

---

## 12. Running locally

```bash
# 1. Clone
git clone https://github.com/<your-org>/lunaquest.git
cd lunaquest

# 2. Environment
cp .env.example .env.local
# Optional: add your free NASA API key (https://api.nasa.gov).
# If omitted, DEMO_KEY is used (rate-limited but functional).
# NASA_API_KEY=your_key_here

# 3. Install
npm install

# 4. Dev server
npm run dev        # http://localhost:3000

# 5. Tests & type check
npm test           # 13 Vitest engine tests
npm run typecheck  # tsc --noEmit

# 6. Production build
npm run build && npm start
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NASA_API_KEY` | No | Free key from https://api.nasa.gov. Falls back to `DEMO_KEY` if unset. |

---

## 13. Deployment

**Vercel (recommended)**
1. Import the repository on [vercel.com](https://vercel.com).
2. Add `NASA_API_KEY` under **Settings → Environment Variables**.
3. Deploy. The `/api/space-weather` route uses Next.js ISR with a 6-hour revalidation window.

---

## 14. Verification & tests

| Check | Result |
|---|---|
| Strict TypeScript (`tsc --noEmit`) | 0 errors in all project files |
| Vitest engine suite | 13 tests pass |
| All 4 scenarios play to completion | ✅ (autoplay tested in each test) |
| Every internal link resolves | ✅ |
| NASA DONKI live / cached / offline states | ✅ (all three states tested manually) |

---

## 15. Accessibility

- Status is always conveyed as **colour + icon + text** — never colour alone.
- 2 px cyan focus rings on every interactive element.
- Radix UI dialogs trap focus and restore it on close.
- Every emergency requires a deliberate decision — no auto-advance.
- Timeline chart has a full text mission-log alternative.
- `prefers-reduced-motion` disables all CSS transitions and canvas animations.
- `aria-live="polite"` on the DONKI status badge and system detail panel.

---

## 16. Limitations & honest disclaimers

| Limitation | Detail |
|---|---|
| **No real radiation doses** | Exposure is an abstract risk index. Shielding lowers risk but no dose (Gy or Sv) is calculated. |
| **Simplified life support** | CO₂ removal, pressure management, fire safety and spare parts are not modelled. |
| **One step per day** | Real systems change minute by minute; the engine sums each day into one step. |
| **Fixed sunlight profiles** | Each scenario uses an illustrative sunlight curve, not a terrain model of a real site. |
| **Mars not playable** | Mars Outpost is designed and shown but gameplay is not yet implemented. |
| **Not tested with students** | Learning benefits are design goals; we have not measured outcomes yet. |
| **Credits replace mass/volume** | The 100-credit budget stands in for all real mission constraints. |

> LunaQuest is an educational game, not an engineering tool. Its numbers must not be used to design real spacecraft or protect real astronauts. Not affiliated with or endorsed by NASA.

---

## 17. What we'd build next

- **Full Mars Outpost scenario** — engine data model already supports it; needs events, UI polish and dust-storm mechanics.
- **Dust storms and thin-atmosphere hazards** specific to Mars.
- **Teacher dashboard** — class-wide mission logs, aggregate decision statistics, export to CSV.
- **Fission surface power upgrade** — unlockable in First Lunar Night, as NASA's own FSP project proposes.
- **Localisation** — Bangla first, then other languages for accessibility.
- **Learning-outcomes study** with student cohorts to measure retention of life-support concepts.
- **Multiplayer / async mode** — each crew member controlled by a different student, decisions shared in real time.
