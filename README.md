# LunaQuest — Junior Astronaut Mission Simulator

**Every Decision Shapes the Mission.** NASA Space Apps Challenge 2026 · *Build a Junior Astronaut Mission Trainer*

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui (Radix) · Zustand · Recharts · lucide-react · Geist.

Educational simulation. **All numbers are illustrative gameplay parameters, not engineering data.** Not affiliated with or endorsed by NASA.

## Run

```bash
cp .env.example .env.local     # add NASA_API_KEY (free at https://api.nasa.gov) — optional, DEMO_KEY is used otherwise
npm install
npm run dev                    # http://localhost:3000
npm test                       # engine unit tests (vitest)
npm run typecheck
npm run build && npm start     # production
```

Deploy on Vercel: import the repo, add `NASA_API_KEY` under Environment Variables, deploy.

## Routes

| Route | Screen |
|---|---|
| `/` | Landing: hero, how a mission works, **day-by-day walkthrough**, systems, trade-offs, scenarios, science & data, crew |
| `/missions` | Mission selection (Moon playable, Mars "in development") |
| `/missions/lunar-alpha/briefing` | Briefing, crew, readiness checklist |
| `/missions/lunar-alpha/configure` | Scenario picker (4 scenarios) + outpost configuration with live projection |
| `/mission` | Mission Control: goal bar, How-to-play guide, resource strip with max capacities, outpost scene, telemetry, decision panel, power switches, bonus spacewalk, "What changed" report |
| `/mission/build` | Build & Upgrade Center (`?system=<id>` preselects a category) |
| `/mission/timeline` | Resource chart, event inspector, mission log |
| `/mission/debrief` | Success · partial success · failure debrief (+ sample debriefs) |
| `/science` | Science Lab (7 modules incl. NASA OSDR radiation finding) |
| `/sources` | Science & Data Sources: live NASA DONKI status, every source labelled, all game parameters, limitations |
| `/design-system` | Tokens and component states |
| `/api/space-weather` | Server route: NASA DONKI (FLR + SEP, last 30 days), 6-hour cache |

## Gameplay features
- **Random emergencies** from a seeded generator: solar storms (forecast 2–3 days ahead, some false alarms), water leaks, power faults, crop failures.
- **4 scenarios:** Lunar Outpost Alpha (30 d) · First Lunar Night (24 d) · Solar Weather Alert (12 d) · Water Under Pressure (15 d).
- **Power switches** (air, water recycling, grow lights, science), **bonus spacewalk** (spends oxygen), **reinforced shelter** (spends battery).
- **Communication delay:** "Ask Mission Control" in every emergency — about 2.6 s round trip at Moon distance; the **Mars-distance drill** (Settings ▸ Communication delay) makes Earth's reply arrive the next day.
- **NASA DONKI** sets storm severity when a mission starts; status is shown as live, cached or unavailable — never invented.
- Crew: Mehedi Hasan (Commander, you), Maimuna Rahman, Nahid Hasan, Joy Barua.

## Architecture

```
src/lib/sim/        Pure TypeScript engine — no React. The only place consequences are computed.
  core.ts           Simulation core (1:1 port of the prototype engine)
  data.ts           Constants, equipment, objectives
  events.ts         Emergency events, choices, previews
  engine.ts         Typed facade: newMission, advanceDay, resolveEvent, purchase, setPower, requestAdvice…
  engine.test.ts    Vitest suite (13 tests)
src/lib/store.ts    Zustand store persisted to localStorage; thin wrapper over the engine
src/components/ui/  shadcn/ui primitives themed with LunaQuest tokens
src/components/lq/  Product components (landing, day-by-day, mission shell, topbar, outpost scene…)
src/app/            Routes
```

## Verified before delivery
- Strict TypeScript check of every file: 0 errors in project code.
- All 13 engine tests pass; all 4 scenarios play to completion.
- Every internal link resolves to an existing route.
- Not yet run here: `next build` itself (needs `npm install`). If your environment reports anything, it will be dependency- or lint-related; send the output and it can be fixed quickly.

## Accessibility
Status = colour + icon + text; 2px cyan focus rings; Radix dialogs trap focus; emergencies need a decision; chart has a text log alternative; `prefers-reduced-motion` disables transitions.
