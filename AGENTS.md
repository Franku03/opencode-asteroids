# AGENTS.md

Compact guide for OpenCode sessions working in this repo.

## Stack

- Single-file HTML5 Canvas game. No framework, no bundler, no dependencies, no `package.json`.
- `index.html` loads `game.js` via a plain `<script>` (no ES modules). Do not introduce `import`/`export` — the file relies on globals (`canvas`, `ctx`, `W`, `H`, `keys`).
- Canvas is fixed `800×600`, set in **both** `index.html` (`width`/`height` attrs) and `game.js` (`W`, `H` consts). Change them together.

## Run / verify

There is no build, lint, typecheck, or test step. Verification is manual:

```bash
npx serve .      # then open http://localhost:3000
```

Opening `index.html` directly via `file://` also works (no fetch/modules). After any change, reload the browser and play to confirm.

## Architecture (all in `game.js`)

- One file, top-to-bottom: input → utils → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`) → game state → `update(dt)` → `draw()` → `requestAnimationFrame` loop.
- Entity tables (`bullets`, `asteroids`, `particles`) are plain arrays filtered each frame by `dead` flag. New entities spawned mid-iteration are pushed to a separate array and concatenated after the loop (see bullet/asteroid collision in `update`).
- Toroidal space: positions wrapped with `wrap(v, max)`. All movement uses `dt` (seconds). `dt` is clamped to `0.05` in `loop` to avoid the spiral-of-death after tab switches.
- State machine: `'playing' | 'dead' | 'gameover'`, transitions live in `update()`. `initGame()` is the only (re)entry point.
- Tunables are inline consts per class (e.g. `ROT`, `THRUST`, `DRAG` in `Ship.update`; `RADII`/`SPEEDS`/`POINTS` arrays indexed by `size` 1–3). There is no config file.

## Input model (easy to get wrong)

- `keys[code]` — currently-held state (use for continuous actions like thrust/rotate).
- `pressed(code)` — edge-detected "just pressed this frame"; **consumed on read**. Use for discrete actions (shoot, restart). Calling it twice per frame silently drops the event.

## Conventions

- UI strings and code comments are in **Spanish**; identifiers are in English. Match this when editing.
- `'use strict'` at top of `game.js`; keep it.

## Known doc drift

`README.md` advertises power-ups and a "estrella fugaz" (shooting star) asteroid type. These are **not** implemented in `game.js`. Treat the code as the source of truth, not the README, when resolving conflicts.
