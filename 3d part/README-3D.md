# LunaQuest — 3D mission update (Next.js)

Drop these files into your `lunaquest-next` project, keeping the same paths.

## New
- `src/app/play-3d/page.tsx` — route **/play-3d** (full-screen).
- `src/components/lq/game3d/game-3d.tsx` — client component. Bridges the 3D view to the existing engine (`@/lib/sim/core`) and the Zustand store, so 2D (/mission) and 3D share one saved mission.
- `src/components/lq/game3d/lq-game.js` — the 3D game (three.js): walkable outpost, animated crew, emergencies, Build, Timeline, power switches, bonus spacewalk, Ask Mission Control, Mars drill.
- `src/components/lq/game3d/lq-icons.js` — icon elements used by the 3D HUD.
- `*.d.ts` — type stubs so TypeScript accepts the JS modules.

## Changed
- `package.json` — adds `"three": "0.160.0"`.
- `src/components/lq/mission/shell.tsx` — "3D view" button in the Mission Control toolbar.
- `src/components/lq/landing/landing.tsx` — "3D mission" link in the footer.

## Install
```bash
npm install          # pulls three
npm run dev          # open http://localhost:3000/play-3d
```

Needs WebGL. Without it, the page shows a message and a link to the 2D Mission Control.
