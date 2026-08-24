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

- One file, top-to-bottom: input → utils → entity classes (`Bullet`, `Asteroid`, `ShootingStar`, `PowerUp`, `Ship`, `Particle`) → game state → `update(dt)` → `draw()` → `requestAnimationFrame` loop.
- Entity tables (`bullets`, `asteroids`, `powerups`, `particles`) are plain arrays filtered each frame by `dead` flag. New entities spawned mid-iteration are pushed to a separate array and concatenated after the loop (see bullet/asteroid collision in `update`). `ShootingStar` instances live in the `asteroids` array and are spawned via `newAsteroids` (not pushed directly to `asteroids`) to avoid mid-iteration mutation.
- Toroidal space: positions wrapped with `wrap(v, max)`. All movement uses `dt` (seconds). `dt` is clamped to `0.05` in `loop` to avoid the spiral-of-death after tab switches.
- State machine: `'playing' | 'dead' | 'gameover'`, transitions live in `update()`. `initGame()` is the only (re)entry point.
- Tunables are inline consts per class (e.g. `ROT`, `THRUST`, `DRAG` in `Ship.update`; `RADII`/`SPEEDS`/`POINTS` arrays indexed by `size` 1–3). There is no config file. Power-up "Velocidad" tunables live as module consts near the asteroid tables: `POWERUP_DROP_CHANCE`, `POWERUP_TTL`, `POWERUP_RADIUS`, `SPEED_BOOST_DURATION`, `SPEED_BOOST_MULT`. Estrella Fugaz tunables live alongside them: `SHOOTING_STAR_CHANCE`, `SHOOTING_STAR_SPEED`, `SHOOTING_STAR_TTL`, `SHOOTING_STAR_POINTS`, `SHOOTING_STAR_RADIUS`, `SHOOTING_STAR_TRAIL`.
- Power-up "Velocidad": `PowerUp` orbs drop on asteroid destruction (`POWERUP_DROP_CHANCE`). On pickup, `ship.speedBoost` is set to `SPEED_BOOST_DURATION` and `Ship.update` multiplies `THRUST` by `SPEED_BOOST_MULT` while the timer is active. Pickup resets (not stacks) the timer; the effect clears on death (`killShip`) and respawn/level reset (`Ship.reset`).
- Estrella Fugaz: `ShootingStar extends Asteroid` (size-1 base, overridden `radius`/`points`/`vx`/`vy`/`rotSpeed`). Spawns on asteroid destruction (`SHOOTING_STAR_CHANCE`) into `newAsteroids`. Has a `ttl` (expires on its own, blink last 1.5 s) and a comet-like golden `trail`. `split()` returns `[]` (no fragments). Scoring reads `a.points` (set in `Asteroid` constructor from `POINTS[size]`), so the subclass overrides points without conditionals in the loop. Counts toward `asteroids.length`, so it blocks `nextLevel` until destroyed or expired.

## Input model (easy to get wrong)

- `keys[code]` — currently-held state (use for continuous actions like thrust/rotate).
- `pressed(code)` — edge-detected "just pressed this frame"; **consumed on read**. Use for discrete actions (shoot, restart). Calling it twice per frame silently drops the event.

## Conventions

- UI strings and code comments are in **Spanish**; identifiers are in English. Match this when editing.
- `'use strict'` at top of `game.js`; keep it.

## Known doc drift

None currently. `README.md` and `game.js` are in sync (Estrella Fugaz and power-up "Velocidad" both implemented). Treat the code as the source of truth, not the README, when resolving conflicts.
